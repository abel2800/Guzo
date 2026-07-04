import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, type DriverLocationPayload } from '@delivery/types';
import { rooms } from '../index.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';

/**
 * Live tracking: drivers emit their GPS position; the server fans it out to the
 * order room (customer + admin watchers). Persistence is handled by the
 * tracking module subscribing to the domain event.
 */
export function registerTrackingHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.DRIVER_LOCATION, (payload: DriverLocationPayload) => {
    if (payload.orderId) {
      io.to(rooms.order(payload.orderId)).emit(SOCKET_EVENTS.ORDER_TRACKING, payload);
    }
    io.to(rooms.admins()).emit(SOCKET_EVENTS.DRIVER_LOCATION, payload);
    eventBus.publish(DOMAIN_EVENTS.DRIVER_LOCATION_UPDATED, payload);
  });

  // Customers/admins subscribe to a specific order's live updates.
  socket.on('order:subscribe', (orderId: string) => socket.join(rooms.order(orderId)));
  socket.on('order:unsubscribe', (orderId: string) => socket.leave(rooms.order(orderId)));
}
