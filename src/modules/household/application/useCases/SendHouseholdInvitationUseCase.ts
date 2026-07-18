import { Static } from '@sinclair/typebox';
import { UseCase } from '../../../../shared/application/useCase.js';
import { EmailService } from '../../../../shared/domain/services/EmailService.js';
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

    await this.emailService.send({
      to: data.recipientEmail,
      subject: `Invitación para unirte a ${household.name}`,
      text: [
        `Hola,`,
        '',
        `${data.requestingUserName} te invitó a unirte al hogar "${household.name}" en Family Collab.`,
        `Usa este código de invitación para unirte: ${household.invite_code}`,
        '',
        'Inicia sesión en la app y usa el código para unirte al hogar.'
      ].join('\n')
    });

    return { recipientEmail: data.recipientEmail };
  }
}
