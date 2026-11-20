import { Type as t } from '@sinclair/typebox';

export const HouseholdMemberSchema = t.Object({
  user_id: t.String(),
  role: t.Union([t.Literal('admin'), t.Literal('member'), t.Literal('kid')]),
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
  /** Plan vigente de quien crea; sin él se aplica el gratis. */
  plan: t.Optional(t.Union([t.Literal('free'), t.Literal('premium')])),
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

export const RegenerateInviteCodeInputSchema = t.Object({
  householdId: t.String(),
  userId: t.String(),
});

export const MemberRoleSchema = t.Union([t.Literal('admin'), t.Literal('member'), t.Literal('kid')]);

export const ChangeMemberRoleInputSchema = t.Object({
  householdId: t.String(),
  requestingUserId: t.String(),
  targetUserId: t.String(),
  role: MemberRoleSchema,
});

export const AddMemberInputSchema = t.Object({
  inviteCode: t.String(),
  userId: t.String(),
  userName: t.String(),
  /** Plan vigente de quien se une; sin él se aplica el gratis. */
  plan: t.Optional(t.Union([t.Literal('free'), t.Literal('premium')]))
});

export const SendHouseholdInvitationInputSchema = t.Object({
  householdId: t.String(),
  requestingUserId: t.String(),
  requestingUserName: t.String(),
  recipientEmail: t.String({ format: 'email' })
});

export const SendHouseholdInvitationOutputSchema = t.Object({
  recipientEmail: t.String({ format: 'email' })
});

export const RemoveMemberInputSchema = t.Object({
  householdId: t.String(),
  requestingUserId: t.String(), // The user making the request
  targetUserId: t.String()      // The user being removed (can be the same as requestingUser to leave)
});

export const GetUserHouseholdsInputSchema = t.Object({
  userId: t.String(),
});

export const HouseholdSummarySchema = t.Object({
  id: t.String(),
  name: t.String(),
  role: t.Union([t.Literal('admin'), t.Literal('member'), t.Literal('kid')]),
  is_owner: t.Boolean(),
  invite_code: t.Optional(t.Union([t.String(), t.Null()])),
  members_count: t.Number(),
  /** Premium del hogar: lo decide el plan vigente de su dueño. */
  is_premium: t.Optional(t.Boolean()),
});

export const GetUserHouseholdsOutputSchema = t.Array(HouseholdSummarySchema);
