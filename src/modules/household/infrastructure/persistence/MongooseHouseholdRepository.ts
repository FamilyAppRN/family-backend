import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { HouseholdEntity, HouseholdMemberEntity } from '../../domain/entities/HouseholdEntity.js';
import { Household } from '../../../../models/Household.js';

export class MongooseHouseholdRepository implements HouseholdRepository {
    private mapToEntity(doc: any): HouseholdEntity {
        return {
            id: doc._id.toString(),
            name: doc.name,
            admin_id: doc.owner_id.toString(),
            invite_code: doc.invite_code,
            members: doc.members.map((m: any) => ({
                user_id: m.user_id.toString(),
                role: m.role,
                display_name: m.display_name,
                joined_at: m.joined_at
            })),
            settings: doc.settings ? {
                timezone: doc.settings.timezone,
                locale: doc.settings.locale
            } : undefined,
            created_at: doc.created_at,
            updated_at: doc.updated_at || new Date()
        };
    }

    async create(data: Omit<HouseholdEntity, 'id' | 'created_at' | 'updated_at'>): Promise<HouseholdEntity> {
        const householdData = {
            ...data,
            owner_id: data.admin_id,
            members: data.members.map(m => ({
                ...m,
                user_id: m.user_id as any
            }))
        };
        const household = await Household.create(householdData as any);
        return this.mapToEntity(household.toObject());
    }

    async findById(id: string): Promise<HouseholdEntity | null> {
        const household = await Household.findById(id).lean();
        if (!household) return null;
        return this.mapToEntity(household);
    }

    async findByInviteCode(inviteCode: string): Promise<HouseholdEntity | null> {
        const household = await Household.findOne({ invite_code: inviteCode }).lean();
        if (!household) return null;
        return this.mapToEntity(household);
    }

    async findByUserId(userId: string): Promise<HouseholdEntity[]> {
        const households = await Household.find({
            'members.user_id': userId
        }).lean();
        return households.map((doc: any) => this.mapToEntity(doc));
    }

    async update(id: string, data: Partial<Pick<HouseholdEntity, 'name' | 'settings'>>): Promise<HouseholdEntity> {
        const updateDoc: any = {};
        if (data.name !== undefined) updateDoc.name = data.name;
        if (data.settings !== undefined) updateDoc.settings = data.settings;

        const household = await Household.findByIdAndUpdate(id, { $set: updateDoc }, { new: true }).lean();
        if (!household) throw new Error("Household not found for update");
        return this.mapToEntity(household);
    }

    async addMember(id: string, member: HouseholdMemberEntity): Promise<HouseholdEntity> {
        const household = await Household.findByIdAndUpdate(
            id,
            { $push: { members: member } },
            { new: true }
        ).lean();
        if (!household) throw new Error("Household not found for update");
        return this.mapToEntity(household);
    }

    async removeMember(id: string, userId: string): Promise<HouseholdEntity> {
        const household = await Household.findByIdAndUpdate(
            id,
            { $pull: { members: { user_id: userId } } },
            { new: true }
        ).lean();
        if (!household) throw new Error("Household not found for update");
        return this.mapToEntity(household);
    }

    async delete(id: string): Promise<void> {
        await Household.findByIdAndDelete(id);
    }
}
