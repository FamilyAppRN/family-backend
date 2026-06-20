export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  password_salt_rounds?: number;
  plan: 'free' | 'premium';
  plan_expires_at?: Date;
  push_tokens: any[];
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
