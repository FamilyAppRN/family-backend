import { EmailMessage, EmailService } from '../../domain/services/EmailService.js';
import logger from '../logger.js';

export class LoggingEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    logger.info({ email: message }, 'Household invitation email queued for development delivery');
  }
}
