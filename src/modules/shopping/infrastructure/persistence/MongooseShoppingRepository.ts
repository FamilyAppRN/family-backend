import { ShoppingRepository } from '../../domain/repositories/ShoppingRepository.js';
import { ShoppingList, IShoppingList, IShoppingItem, IShoppingPurchaseHistory } from '../../../../models/ShoppingList.js';
import { ShoppingListEntity, ShoppingItemEntity, ShoppingPurchaseHistoryEntity } from '../../domain/entities/ShoppingListEntity.js';
import { ListNotFoundError, ItemNotFoundError, ActiveListAlreadyExistsError, PurchaseNotReadyError } from '../../domain/errors/ShoppingErrors.js';
import { Types, startSession } from 'mongoose';

export class MongooseShoppingRepository implements ShoppingRepository {

  private mapItemToEntity(item: IShoppingItem): ShoppingItemEntity {
    return {
      id: item._id.toString(),
      name: item.name,
      quantity: item.qty,
      is_completed: item.checked,
      added_by: item.added_by.toString(),
      checked_by: item.checked_by ? item.checked_by.toString() : null
    };
  }

  private mapListToEntity(list: IShoppingList): ShoppingListEntity {
    return {
      id: list._id.toString(),
      household_id: list.household_id.toString(),
      name: list.name,
      status: (list.status || 'active') as 'active' | 'archived',
      items: list.items.map(this.mapItemToEntity.bind(this)),
      history: (list.history || []).map(this.mapHistoryToEntity.bind(this)),
      created_by: list.created_by.toString(),
      created_at: list.created_at,
    };
  }

  private mapHistoryToEntity(history: IShoppingPurchaseHistory): ShoppingPurchaseHistoryEntity {
    return {
      id: history._id.toString(),
      items: history.items.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        quantity: item.qty,
        is_completed: true,
        added_by: item.added_by.toString(),
        checked_by: item.checked_by ? item.checked_by.toString() : null,
      })),
      completed_at: history.completed_at,
      completed_by: history.completed_by.toString(),
    };
  }

  async createList(data: { household_id: string; name: string; created_by: string }): Promise<ShoppingListEntity> {
    try {
      const doc = await ShoppingList.create({
        household_id: new Types.ObjectId(data.household_id),
        name: data.name,
        created_by: new Types.ObjectId(data.created_by),
        items: []
      });
      return this.mapListToEntity(doc);
    } catch (error: any) {
      if (error?.code === 11000) throw new ActiveListAlreadyExistsError();
      throw error;
    }
  }

  async getListById(listId: string): Promise<ShoppingListEntity | null> {
    const doc = await ShoppingList.findById(listId).lean();
    return doc ? this.mapListToEntity(doc as any) : null;
  }

  async getListsByHousehold(householdId: string, status?: 'active' | 'archived'): Promise<ShoppingListEntity[]> {
    const query: any = {
      household_id: new Types.ObjectId(householdId)
    };
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default to active if status is not specified
    }
    const docs = await ShoppingList.find(query).lean();
    return docs.map((doc: any) => this.mapListToEntity(doc));
  }

  async addItemToList(listId: string, item: Omit<ShoppingItemEntity, 'id' | 'is_completed'>): Promise<ShoppingListEntity> {
    const doc = await ShoppingList.findOneAndUpdate(
      { _id: new Types.ObjectId(listId), status: 'active' },
      {
        $push: {
          items: {
            _id: new Types.ObjectId(),
            name: item.name,
            qty: item.quantity,
            category: 'general', // Defaulting category as it is required in Mongoose schema
            added_by: new Types.ObjectId(item.added_by),
            added_at: new Date()
          }
        }
      },
      { new: true }
    );

    if (!doc) throw new ListNotFoundError();

    // Cache Invalidation Note: If using Redis for shopping lists,
    // invalidate or update the cached lists for the doc.household_id here.

    return this.mapListToEntity(doc);
  }

  async toggleItemStatus(listId: string, itemId: string, isCompleted: boolean, userId: string): Promise<ShoppingListEntity> {
    const doc = await ShoppingList.findOneAndUpdate(
      {
        _id: new Types.ObjectId(listId),
        'items._id': new Types.ObjectId(itemId),
        status: 'active'
      },
      {
        $set: {
          'items.$.checked': isCompleted,
          'items.$.checked_by': isCompleted ? new Types.ObjectId(userId) : null
        }
      },
      { new: true }
    );

    if (!doc) {
       // Need to distinguish if list is missing or just item
       const listExists = await ShoppingList.exists({ _id: new Types.ObjectId(listId) });
       if (!listExists) throw new ListNotFoundError();
       throw new ItemNotFoundError();
    }

    // Cache Invalidation Note: Invalidate/update cached lists for doc.household_id here.

    return this.mapListToEntity(doc);
  }

  async updateList(listId: string, data: Partial<{ name: string }>): Promise<ShoppingListEntity> {
    const doc = await ShoppingList.findOneAndUpdate(
      { _id: new Types.ObjectId(listId), status: 'active' },
      { $set: data },
      { new: true }
    );
    if (!doc) throw new ListNotFoundError();
    return this.mapListToEntity(doc);
  }

  async finalizeList(listId: string, completedBy: string): Promise<{ history: ShoppingPurchaseHistoryEntity; active_list: ShoppingListEntity }> {
    const session = await startSession();
    try {
      let result: { history: ShoppingPurchaseHistoryEntity; active_list: ShoppingListEntity } | undefined;
      await session.withTransaction(async () => {
        const completedAt = new Date();
        const historyId = new Types.ObjectId();
        
        const active = await ShoppingList.findOne({
          _id: new Types.ObjectId(listId),
          status: 'active',
        }).session(session);

        if (!active) {
          const exists = await ShoppingList.exists({ _id: new Types.ObjectId(listId) }).session(session);
          if (!exists) throw new ListNotFoundError();
          throw new PurchaseNotReadyError(); // Active list doesn't exist or is archived
        }

        if (active.items.length === 0 || active.items.some(item => !item.checked)) {
          throw new PurchaseNotReadyError();
        }

        const newHistory = {
          _id: historyId,
          items: active.items.map(i => (i as any).toObject()), // Convert subdocuments to plain objects
          completed_at: completedAt,
          completed_by: new Types.ObjectId(completedBy),
        };

        if (!active.history) {
          active.history = [];
        }
        
        active.history.push(newHistory as any);
        active.items = []; // Clear the active items

        await active.save({ session });

        const history = active.history[active.history.length - 1];
        if (!history) throw new PurchaseNotReadyError();

        result = {
          history: this.mapHistoryToEntity(history),
          active_list: this.mapListToEntity(active),
        };
      });
      if (!result) throw new PurchaseNotReadyError();
      return result;
    } finally {
      await session.endSession();
    }
  }

  async getHistoryByHousehold(householdId: string): Promise<ShoppingPurchaseHistoryEntity[]> {
    const list = await ShoppingList.findOne({ household_id: new Types.ObjectId(householdId), status: 'active' }).lean();
    if (!list) return [];
    return (list.history || []).map((history: IShoppingPurchaseHistory) => this.mapHistoryToEntity(history)).reverse();
  }

  async deleteList(listId: string): Promise<void> {
    const result = await ShoppingList.deleteOne({ _id: new Types.ObjectId(listId), status: 'active' });
    if (result.deletedCount === 0) throw new ListNotFoundError();

    // Cache Invalidation Note: Invalidate/update cached lists for this household here.
  }
}
