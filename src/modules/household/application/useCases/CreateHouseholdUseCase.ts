import { UseCase } from '../../../../shared/application/useCase.js';
import { HouseholdEntity } from '../../domain/entities/HouseholdEntity.js';
import { HouseholdRepository } from '../../domain/repositories/HouseholdRepository.js';
import { CreateHouseholdInputSchema, HouseholdSchema } from '../schemas/household.schemas.js';
import { Static } from '@sinclair/typebox';
import crypto from 'crypto';

type Input = Static<typeof CreateHouseholdInputSchema>;
type Output = Static<typeof HouseholdSchema>;

export class CreateHouseholdUseCase extends UseCase<any, any> {
    protected inputSchema: any = CreateHouseholdInputSchema;
    protected outputSchema: any = HouseholdSchema;

    constructor(private repository: HouseholdRepository) {
        super();
    }

    protected async implementation(data: Input): Promise<Output> {
        // Generate a random 6-character invite code
        const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const householdData = {
            name: data.name,
            admin_id: data.user_id,
            invite_code: inviteCode,
            members: [
                {
                    user_id: data.user_id,
                    role: 'admin' as const,
                    display_name: data.user_name,
                    joined_at: new Date()
                }
            ],
            settings: data.settings || {
                timezone: 'America/Caracas',
                locale: 'es-VE'
            }
        };

        const household = await this.repository.create(householdData);

        return household;
    }
}
