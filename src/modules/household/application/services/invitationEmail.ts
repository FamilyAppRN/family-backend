import { EmailMessage } from '../../../../shared/domain/services/EmailService.js';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Email de invitación. El código es lo principal: muchos clientes de correo
 * (Gmail entre ellos) no abren enlaces gestia://, así que el enlace es un
 * atajo y el código siempre funciona escribiéndolo en la app.
 */
export function buildInvitationEmail(input: {
  to: string;
  inviterName: string;
  householdName: string;
  inviteCode: string;
}): EmailMessage {
  const link = `gestia://join?code=${encodeURIComponent(input.inviteCode)}`;
  const inviter = escapeHtml(input.inviterName);
  const household = escapeHtml(input.householdName);
  const code = escapeHtml(input.inviteCode);

  return {
    to: input.to,
    subject: `${input.inviterName} te invitó a ${input.householdName} en Gestia`,
    text: [
      'Hola,',
      '',
      `${input.inviterName} te invitó a unirte al hogar "${input.householdName}" en Gestia.`,
      '',
      `Tu código de invitación: ${input.inviteCode}`,
      '',
      'Abre Gestia, inicia sesión y escribe el código en "Me invitaron".',
      `Si tienes la app instalada en este teléfono, también puedes abrir: ${link}`,
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;color:#171510;max-width:480px">
  <p>Hola,</p>
  <p><strong>${inviter}</strong> te invitó a unirte al hogar <strong>${household}</strong> en Gestia.</p>
  <p style="margin:24px 0 8px">Tu código de invitación:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#F1F8F4;color:#2E6240;padding:12px 16px;border-radius:12px;display:inline-block">${code}</p>
  <p>Abre Gestia, inicia sesión y escribe el código en <em>Me invitaron</em>.</p>
  <p><a href="${link}" style="color:#2E6240">Abrir en la app</a> (si la tienes instalada en este teléfono)</p>
</div>`,
  };
}
