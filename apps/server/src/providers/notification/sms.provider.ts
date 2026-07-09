import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface SmsMessage {
  to: string;
  body: string;
}

class SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    const to = normalizePhone(message.to);
    if (!to) {
      logger.warn('[SMS] skipped — invalid recipient phone');
      return;
    }

    if (env.sms.driver === 'console') {
      logger.info(`[SMS:console] to=${to} body="${message.body}"`);
      return;
    }

    if (env.sms.driver === 'twilio') {
      await this.sendTwilio({ ...message, to });
      return;
    }

    logger.warn(`SMS driver "${env.sms.driver}" not implemented; message dropped.`);
  }

  private async sendTwilio(message: SmsMessage): Promise<void> {
    const { accountSid, authToken, fromNumber } = env.sms.twilio;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio SMS requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: message.to,
      From: fromNumber,
      Body: message.body.slice(0, 1600),
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      const detail = await res.text();
      logger.error(`[SMS:twilio] failed ${res.status}: ${detail}`);
      throw new Error(`Twilio SMS failed (${res.status})`);
    }

    logger.info(`[SMS:twilio] sent to=${message.to}`);
  }
}

function normalizePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('0')) return `+251${trimmed.slice(1)}`;
  return trimmed;
}

export const smsProvider = new SmsProvider();
