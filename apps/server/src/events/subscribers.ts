import { prisma } from '@delivery/database';
import { eventBus, DOMAIN_EVENTS } from './eventBus.js';
import { emitToUser } from '../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';
import { emailProvider } from '../providers/notification/email.provider.js';
import { smsProvider } from '../providers/notification/sms.provider.js';
import { pushProvider } from '../providers/notification/push.provider.js';
import { logger } from '../config/logger.js';
import { notifyReceiver, trackUrl } from '../modules/orders/order-notifications.js';
import {
  buildDeliveryConfirmationHtml,
  buildPaymentReceiptHtml,
  buildPaymentReceiptText,
} from '../providers/notification/templates/receipt.template.js';

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  body: string;
  email?: boolean;
  sms?: boolean;
}

const SMS_ORDER_STATUSES = ['OUT_FOR_DELIVERY', 'DELIVERED', 'READY_FOR_PICKUP', 'AT_BRANCH', 'AT_WAREHOUSE'] as const;

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, phone: true },
    });
    if (!user) return;

    if (payload.email) {
      await emailProvider.send({ to: user.email, subject: payload.title, html: `<p>${payload.body}</p>` });
    }

    const sendSms = payload.sms ?? payload.type.includes('ORDER');
    if (sendSms && user.phone) {
      await smsProvider.send({ to: user.phone, body: `${payload.title}: ${payload.body}` });
    }
  });

  eventBus.subscribe<{ orderId: string; orderNumber: string }>(DOMAIN_EVENTS.ORDER_CREATED, async ({ orderId, orderNumber }) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: { select: { email: true, phone: true, firstName: true } } } },
        packages: { take: 1, select: { trackingNumber: true } },
      },
    });
    if (!order?.customer?.user) return;

    const { email, phone, firstName } = order.customer.user;
    const tracking = order.packages[0]?.trackingNumber ?? orderNumber;
    const url = trackUrl(tracking);

    await emailProvider.send({
      to: email,
      subject: `Guzo order confirmed — ${orderNumber}`,
      html: `<p>Hi ${firstName},</p>
        <p>Your shipment <strong>${orderNumber}</strong> is confirmed.</p>
        <p>Tracking: <strong>${tracking}</strong></p>
        <p><a href="${url}">Track your parcel</a></p>`,
      text: `Order ${orderNumber} confirmed. Track: ${url}`,
    });

    if (phone) {
      await smsProvider.send({
        to: phone,
        body: `Guzo: Order ${orderNumber} confirmed. Track at ${url}`,
      });
    }
  });

  eventBus.subscribe<{ orderId: string }>(DOMAIN_EVENTS.PAYMENT_SUCCEEDED, async ({ orderId }) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: { select: { email: true, phone: true, firstName: true } } } },
        payment: true,
        invoice: true,
        packages: { take: 1, select: { trackingNumber: true } },
      },
    });
    if (!order?.customer?.user) return;

    const { email, firstName } = order.customer.user;
    const amount = Number(order.totalAmount).toLocaleString();
    const ref = order.payment?.reference ?? order.orderNumber;
    const tracking = order.packages[0]?.trackingNumber ?? order.orderNumber;
    const url = trackUrl(tracking);

    const receipt = {
      firstName,
      orderNumber: order.orderNumber,
      currency: order.currency,
      amount,
      reference: ref,
      invoiceNumber: order.invoice?.invoiceNumber,
      paymentMethod: order.payment?.method,
      paidAt: order.payment?.paidAt ?? new Date(),
      trackingNumber: tracking,
      trackUrl: url,
    };

    await emailProvider.send({
      to: email,
      subject: `Guzo receipt — ${order.orderNumber}`,
      html: buildPaymentReceiptHtml(receipt),
      text: buildPaymentReceiptText(receipt),
    });

    if (order.customer.user.phone) {
      await smsProvider.send({
        to: order.customer.user.phone,
        body: `Guzo: Payment of ${order.currency} ${amount} received for ${order.orderNumber}. Ref: ${ref}`,
      });
    }
  });

  eventBus.subscribe<{ orderId: string; status: string }>(DOMAIN_EVENTS.ORDER_STATUS_CHANGED, async ({ orderId, status }) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: { select: { email: true, phone: true, firstName: true } } } },
        packages: { take: 1, select: { trackingNumber: true } },
      },
    });
    if (!order?.customer?.user) return;

    const { email, phone, firstName } = order.customer.user;
    const tracking = order.packages[0]?.trackingNumber ?? order.orderNumber;
    const url = trackUrl(tracking);

    if (SMS_ORDER_STATUSES.includes(status as (typeof SMS_ORDER_STATUSES)[number]) && phone) {
      await smsProvider.send({
        to: phone,
        body: `Guzo: Order ${order.orderNumber} is now ${statusLabel(status)}.`,
      });
    }

    const receiverStatuses = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ASSIGNED', 'READY_FOR_PICKUP'] as const;
    if (receiverStatuses.includes(status as (typeof receiverStatuses)[number])) {
      const receiverBody =
        status === 'ASSIGNED'
          ? `A driver is assigned to deliver parcel ${tracking}. Track: ${url}`
          : status === 'PICKED_UP'
            ? `Parcel ${tracking} was picked up and is on the way. Track: ${url}`
            : status === 'OUT_FOR_DELIVERY'
              ? `Parcel ${tracking} is out for delivery. Track: ${url}`
              : status === 'DELIVERED'
                ? `Parcel ${tracking} has been delivered.`
                : `Parcel ${tracking} is ready for pickup at the branch.`;
      await notifyReceiver({
        receiverUserId: order.receiverUserId,
        receiverPhone: order.receiverPhone,
        type: `ORDER_${status}`,
        title: `Parcel update — ${statusLabel(status)}`,
        body: receiverBody,
        sms: ['OUT_FOR_DELIVERY', 'DELIVERED', 'READY_FOR_PICKUP', 'PICKED_UP'].includes(status),
      });
    }

    if (status === 'DELIVERED') {
      await emailProvider.send({
        to: email,
        subject: `Delivered — ${order.orderNumber}`,
        html: buildDeliveryConfirmationHtml({
          firstName,
          orderNumber: order.orderNumber,
          trackingNumber: tracking,
          trackUrl: url,
        }),
        text: `Hi ${firstName}, your order ${order.orderNumber} has been delivered.`,
      });
    } else if (['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(status)) {
      await emailProvider.send({
        to: email,
        subject: `Order update — ${order.orderNumber}`,
        html: `<p>Hi ${firstName},</p>
          <p>Your order <strong>${order.orderNumber}</strong> is now <strong>${statusLabel(status)}</strong>.</p>
          <p><a href="${url}">Track shipment</a></p>`,
        text: `Order ${order.orderNumber} is now ${statusLabel(status)}. Track: ${url}`,
      });
    }
  });

  logger.info('Domain event subscribers registered');
}
