import { prisma } from '@delivery/database';
import { eventBus, DOMAIN_EVENTS } from './eventBus.js';
import { emitToUser } from '../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';
import { emailProvider } from '../providers/notification/email.provider.js';
import { pushProvider } from '../providers/notification/push.provider.js';
import { logger } from '../config/logger.js';

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  body: string;
  email?: boolean;
}

/**
 * Wires domain events to side-effects (notifications, etc). Keeping this in one
 * place means modules stay decoupled - they just publish events.
 */
export function registerSubscribers(): void {
  eventBus.subscribe<NotificationRequest>(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, async (payload) => {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        channel: 'IN_APP',
        status: 'SENT',
        type: payload.type,
        title: payload.title,
        body: payload.body,
        sentAt: new Date(),
      },
    });
    emitToUser(payload.userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

    await pushProvider.send({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: { notificationId: notification.id, type: payload.type },
    });

    if (payload.email) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (user) {
        await emailProvider.send({ to: user.email, subject: payload.title, html: `<p>${payload.body}</p>` });
      }
    }
  });

  eventBus.subscribe(DOMAIN_EVENTS.ORDER_CREATED, (payload) => {
    logger.debug(`subscriber: order created ${JSON.stringify(payload)}`);
  });

  logger.info('Domain event subscribers registered');
}
