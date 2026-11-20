import { HouseholdEntity, HouseholdMemberEntity } from '../entities/HouseholdEntity.js';

export interface HouseholdRepository {
    create(data: Omit<HouseholdEntity, 'id' | 'created_at' | 'updated_at' | 'invite_code'> & { invite_code: string }): Promise<HouseholdEntity>;
    findById(id: string): Promise<HouseholdEntity | null>;
    findByInviteCode(inviteCode: string): Promise<HouseholdEntity | null>;
    findByUserId(userId: string): Promise<HouseholdEntity[]>;
    update(id: string, data: Partial<Pick<HouseholdEntity, 'name' | 'settings'>>): Promise<HouseholdEntity>;
    addMember(id: string, member: HouseholdMemberEntity): Promise<HouseholdEntity>;
    removeMember(id: string, userId: string): Promise<HouseholdEntity>;
    /** Cambia el código; falla con error de duplicado si ya existe otro igual. */
    setInviteCode(id: string, inviteCode: string): Promise<HouseholdEntity>;
    delete(id: string): Promise<void>;
}
