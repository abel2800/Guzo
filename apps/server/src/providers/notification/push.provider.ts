import { prisma } from '@delivery/database';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Push notification abstraction.
 * - console: log only (local dev)
 * - expo: send via Expo Push API to registered device tokens
 */
class PushProvider {
  async send(message: PushMessage): Promise<void> {
    if (env.push.driver === 'console') {
      logger.info(`[PUSH:console] user=${message.userId} title="${message.title}"`);
      return;
    }

    if (env.push.driver === 'expo') {
      const devices = await prisma.pushDevice.findMany({ where: { userId: message.userId } });
      if (!devices.length) return;

      const payloads = devices.map((d) => ({
        to: d.token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: 'default',
      }));

      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloads),
        });
        if (!res.ok) {
          logger.warn(`Expo push failed: ${res.status} ${await res.text()}`);
        }
      } catch (err) {
        logger.warn(`Expo push error: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    logger.warn(`Push driver "${env.push.driver}" not implemented; message dropped.`);
  }
}

export const pushProvider = new PushProvider();
