export interface HouseholdMemberEntity {
  user_id: string;
  role: 'admin' | 'member';
  display_name: string;
  joined_at: Date;
}

export interface HouseholdEntity {
  id: string;
  name: string;
  admin_id: string;
  members: HouseholdMemberEntity[];
  invite_code: string;
  settings?: {
    timezone: string;
    locale: string;
  };
  created_at: Date;
  updated_at: Date;
}
