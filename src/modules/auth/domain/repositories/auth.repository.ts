import { UserEntity } from '../entities/auth.entity.js';

export interface AuthRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  deletePushToken(userId: string, token: string): Promise<void>;
  addPushToken(userId: string, token: string): Promise<void>;
  saveRefreshToken(userId: string, token: string, expiresAt: Date, deviceInfo?: string): Promise<void>;
  findRefreshToken(token: string): Promise<any | null>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteAllUserRefreshTokens(userId: string): Promise<void>;
}
