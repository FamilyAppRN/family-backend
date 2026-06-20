import { t } from 'elysia';

export const createHouseholdSchema = t.Object({
  name: t.String({ minLength: 2, error: 'Household name must be at least 2 characters long' }),
  timezone: t.Optional(t.String()),
  locale: t.Optional(t.String()),
});

export const joinHouseholdSchema = t.Object({
  invite_code: t.String({ minLength: 6, maxLength: 6, error: 'Invite code must be exactly 6 characters' }),
  display_name: t.String({ minLength: 2 }),
});
