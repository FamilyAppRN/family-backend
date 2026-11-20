export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Versión HTML opcional; si falta, el proveedor usa el texto. */
  html?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}
