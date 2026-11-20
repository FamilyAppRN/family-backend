import { ENV } from '../../../config/env.js';
import { EmailService } from '../../domain/services/EmailService.js';
import { LoggingEmailService } from './LoggingEmailService.js';
import { ResendEmailService } from './ResendEmailService.js';

/** Resend si hay clave; si no (desarrollo), los emails solo van al log. */
export function createEmailService(): EmailService {
  return ENV.RESEND_API_KEY
    ? new ResendEmailService(ENV.RESEND_API_KEY, ENV.EMAIL_FROM)
    : new LoggingEmailService();
}
