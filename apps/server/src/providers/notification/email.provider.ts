import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailProvider {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.secure,
        auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    if (env.email.driver === 'console') {
      logger.info(`[EMAIL:console] to=${message.to} subject="${message.subject}"`);
      return;
    }
    await this.getTransporter().sendMail({
      from: env.email.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

export const emailProvider = new EmailProvider();
