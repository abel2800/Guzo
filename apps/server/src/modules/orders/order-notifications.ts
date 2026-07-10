import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { smsProvider } from '../../providers/notification/sms.provider.js';
import { env } from '../../config/env.js';

export function trackUrl(reference: string): string {
  const base = env.corsOrigins[0] ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/track/${encodeURIComponent(reference)}`;
}

export async function notifyReceiver(params: {
  receiverUserId?: string | null;
  receiverPhone?: string | null;
  type: string;
  title: string;
  body: string;
  sms?: boolean;
}) {
  if (params.receiverUserId) {
    eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
      userId: params.receiverUserId,
      type: params.type,
      title: params.title,
      body: params.body,
      sms: params.sms ?? true,
    });
  }

  if ((params.sms ?? true) && params.receiverPhone) {
    await smsProvider.send({ to: params.receiverPhone, body: `Guzo: ${params.title}. ${params.body}` });
  }
}
