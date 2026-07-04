import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@delivery/types';
import { rooms } from '../index.js';

interface DriverStatusPayload {
  driverId: string;
  status: 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY' | 'ON_BREAK';
  isAvailable: boolean;
}

/** Driver online/availability presence, broadcast to admins live dashboard. */
export function registerPresenceHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.DRIVER_STATUS, (payload: DriverStatusPayload) => {
    io.to(rooms.admins()).emit(SOCKET_EVENTS.DRIVER_STATUS, payload);
  });
}
