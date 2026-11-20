import { Static } from '@sinclair/typebox';
import { UseCase } from '../../../../shared/application/useCase.js';
import { EmailService } from '../../../../shared/domain/services/EmailService.js';
import { buildInvitationEmail } from '../services/invitationEmail.js';
import { HouseholdNotFoundError, NotHouseholdAdminError } from '../../domain/errors/HouseholdErrors.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import {
  SendHouseholdInvitationInputSchema,
  SendHouseholdInvitationOutputSchema
} from '../schemas/household.schemas.js';

type Input = Static<typeof SendHouseholdInvitationInputSchema>;
type Output = Static<typeof SendHouseholdInvitationOutputSchema>;

export class SendHouseholdInvitationUseCase extends UseCase<Input, Output> {
  protected inputSchema = SendHouseholdInvitationInputSchema;
  protected outputSchema = SendHouseholdInvitationOutputSchema;

  constructor(
    private repository: HouseholdRepository,
    private emailService: EmailService
  ) {
    super();
  }

  protected async implementation(data: Input): Promise<Output> {
    const household = await this.repository.findById(data.householdId);

    if (!household) {
      throw new HouseholdNotFoundError();
    }

    const requestingMember = household.members.find(member => member.user_id === data.requestingUserId);
    if (!requestingMember || requestingMember.role !== 'admin') {
      throw new NotHouseholdAdminError();
    }

    await this.emailService.send(buildInvitationEmail({
      to: data.recipientEmail,
      inviterName: data.requestingUserName,
      householdName: household.name,
      inviteCode: household.invite_code,
    }));

    return { recipientEmail: data.recipientEmail };
  }
}
