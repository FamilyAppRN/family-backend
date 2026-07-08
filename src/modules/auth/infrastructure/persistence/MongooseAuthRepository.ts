import { AuthRepository } from '../../domain/repositories/auth.repository.js';
import { UserEntity } from '../../domain/entities/auth.entity.js';
import { User } from '../../../../models/User.js';

export class MongooseAuthRepository implements AuthRepository {
    private mapToEntity(doc: any): UserEntity {
        return {
            id: doc._id.toString(),
            firebase_uid: doc.firebase_uid,
            email: doc.email,
            name: doc.name,
            plan: doc.plan,
            plan_expires_at: doc.plan_expires_at,
            push_tokens: doc.push_tokens || [],
            notifications_enabled: doc.notifications_enabled,
            created_at: doc.created_at,
            updated_at: doc.updated_at
        };
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const user = await User.findOne({ email }).lean();
        return user ? this.mapToEntity(user) : null;
    }

    async findById(id: string): Promise<UserEntity | null> {
        const user = await User.findById(id).lean();
        return user ? this.mapToEntity(user) : null;
    }

    async findByFirebaseUid(uid: string): Promise<UserEntity | null> {
        const user = await User.findOne({ firebase_uid: uid }).lean();
        return user ? this.mapToEntity(user) : null;
    }

    async create(userData: Partial<UserEntity>): Promise<UserEntity> {
        const user = await User.create(userData);
        return this.mapToEntity(user);
    }

    async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
        const user = await User.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!user) throw new Error('User not found');
        return this.mapToEntity(user);
    }

    async deletePushToken(userId: string, token: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $pull: { push_tokens: { token } } as any
        });
    }

    async addPushToken(userId: string, token: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $addToSet: { push_tokens: { token, device_label: 'default', registered_at: new Date() } } as any
        });
    }
}
