import { Schema, model, Document, Types } from 'mongoose';

export interface IHouseholdMember {
  user_id: Types.ObjectId;
  role: 'admin' | 'member';
  display_name: string;
  joined_at: Date;
}

export interface IHouseholdSettings {
  timezone: string;
  locale: string;
}

export interface IHousehold extends Document {
  _id: Types.ObjectId;
  name: string;
  owner_id: Types.ObjectId;
  invite_code: string;
  members: IHouseholdMember[];
  settings: IHouseholdSettings;
  created_at: Date;
}

const memberSchema = new Schema<IHouseholdMember>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['admin', 'member'], required: true },
  display_name: { type: String, required: true },
  joined_at: { type: Date, default: Date.now },
}, { _id: false });

const householdSchema = new Schema<IHousehold>({
  name: { type: String, required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invite_code: { type: String, required: true, unique: true, index: true },
  members: [memberSchema],
  settings: {
    timezone: { type: String, default: 'America/Caracas' },
    locale: { type: String, default: 'es-VE' }
  },
  created_at: { type: Date, default: Date.now }
});



export const Household = model<IHousehold>('Household', householdSchema);
