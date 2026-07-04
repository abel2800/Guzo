import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface SmsMessage {
  to: string;
  body: string;
}

/**
 * SMS abstraction. console driver logs locally; swap to Twilio/Africa's Talking
 * later by implementing the same `send` method and selecting via SMS_DRIVER.
 */
class SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    if (env.sms.driver === 'console') {
      logger.info(`[SMS:console] to=${message.to} body="${message.body}"`);
      return;
    }
    // TODO: integrate real SMS gateway here.
    logger.warn(`SMS driver "${env.sms.driver}" not implemented; message dropped.`);
  }
}

export const smsProvider = new SmsProvider();
