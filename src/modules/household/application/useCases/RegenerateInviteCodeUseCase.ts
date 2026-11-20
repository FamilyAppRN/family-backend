import { Static } from '@sinclair/typebox';
import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { HouseholdNotFoundError, NotHouseholdAdminError } from '../../domain/errors/HouseholdErrors.js';
import { generateInviteCode } from '../../domain/services/inviteCode.js';
import { HouseholdSchema, RegenerateInviteCodeInputSchema } from '../schemas/household.schemas.js';

type Input = Static<typeof RegenerateInviteCodeInputSchema>;
type Output = Static<typeof HouseholdSchema>;

/** Hay ~16 millones de códigos: un choque es raro, pero se reintenta. */
const MAX_ATTEMPTS = 5;

const isDuplicateKey = (error: unknown) => (error as { code?: number })?.code === 11000;

/**
 * Cambia el código de invitación (solo admin). El anterior deja de servir:
 * útil si se compartió de más.
 */
export class RegenerateInviteCodeUseCase extends UseCase<Input, Output> {
  protected inputSchema = RegenerateInviteCodeInputSchema;
  protected outputSchema = HouseholdSchema;

  constructor(private repository: HouseholdRepository) {
    super();
  }

  protected async implementation(data: Input): Promise<Output> {
    const household = await this.repository.findById(data.householdId);
    if (!household) throw new HouseholdNotFoundError();

    const member = household.members.find((m) => m.user_id === data.userId);
    if (!member || member.role !== 'admin') throw new NotHouseholdAdminError();

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.repository.setInviteCode(data.householdId, generateInviteCode());
      } catch (error) {
        if (!isDuplicateKey(error) || attempt >= MAX_ATTEMPTS) throw error;
      }
    }
  }
}
