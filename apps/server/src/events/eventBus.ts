import { EventEmitter } from 'node:events';
import { logger } from '../config/logger.js';

/**
 * In-process domain event bus. Modules publish events (e.g. "order.created")
 * and other modules subscribe, keeping them decoupled.
 *
 * MIGRATION SEAM: replace this single file with a Kafka/RabbitMQ producer +
 * consumer later. The publish/subscribe API stays identical, so business code
 * never changes.
 */
class DomainEventBus extends EventEmitter {
  publish<T>(event: string, payload: T): void {
    logger.debug(`event published: ${event}`);
    this.emit(event, payload);
  }

  subscribe<T>(event: string, handler: (payload: T) => void | Promise<void>): void {
    this.on(event, (payload: T) => {
      Promise.resolve(handler(payload)).catch((err) =>
        logger.error(`event handler failed for ${event}: ${String(err)}`),
      );
    });
  }
}

export const eventBus = new DomainEventBus();

export const DOMAIN_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  DRIVER_ASSIGNED: 'delivery.driver_assigned',
  DRIVER_LOCATION_UPDATED: 'driver.location_updated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_REFUNDED: 'payment.refunded',
  NOTIFICATION_REQUESTED: 'notification.requested',
} as const;
