export interface UserEntity {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
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
