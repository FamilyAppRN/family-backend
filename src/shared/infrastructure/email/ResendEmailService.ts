import { EmailMessage, EmailService } from '../../domain/services/EmailService.js';
import { ApplicationError } from '../../domain/error.js';

/** Envía con la API HTTP de Resend (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApplicationError(
        502,
        'No se pudo enviar el email de invitación',
        'EMAIL_SEND_FAILED',
        'INFRASTRUCTURE',
        { status: response.status, detail: detail.slice(0, 300) },
      );
    }
  }
}
