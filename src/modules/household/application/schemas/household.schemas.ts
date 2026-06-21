import { Type as t } from '@sinclair/typebox';

export const HouseholdMemberSchema = t.Object({
  user_id: t.String(),
  role: t.Union([t.Literal('admin'), t.Literal('member')]),
  display_name: t.String(),
  joined_at: t.Any(),
});

export const HouseholdSchema = t.Object({
  id: t.String(),
  name: t.String(),
  admin_id: t.String(),
  members: t.Array(HouseholdMemberSchema),
  invite_code: t.String(),
  settings: t.Optional(t.Object({
    timezone: t.String(),
    locale: t.String()
  })),
  created_at: t.Any(),
  updated_at: t.Any(),
});

export const CreateHouseholdInputSchema = t.Object({
  name: t.String({ minLength: 1 }),
  user_id: t.String(),
  user_name: t.String(),
  settings: t.Optional(t.Object({
    timezone: t.String(),
    locale: t.String()
  }))
});

export const GetHouseholdInputSchema = t.Object({
  householdId: t.String(),
  userId: t.String()
});

export const UpdateHouseholdInputSchema = t.Object({
  householdId: t.String(),
  userId: t.String(),
  name: t.Optional(t.String({ minLength: 1 })),
  settings: t.Optional(t.Object({
    timezone: t.String(),
    locale: t.String()
  }))
});

export const AddMemberInputSchema = t.Object({
  inviteCode: t.String(),
  userId: t.String(),
  userName: t.String()
});

export const RemoveMemberInputSchema = t.Object({
  householdId: t.String(),
  requestingUserId: t.String(), // The user making the request
  targetUserId: t.String()      // The user being removed (can be the same as requestingUser to leave)
});
