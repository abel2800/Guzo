import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@delivery/types';
import { rooms } from '../index.js';

interface ChatPayload {
  toUserId: string;
  orderId?: string;
  message: string;
}

/** Simple 1:1 / order-scoped chat (customer <-> driver <-> support). */
export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: ChatPayload) => {
    const fromUserId = socket.data.userId as string;
    const envelope = { ...payload, fromUserId, sentAt: new Date().toISOString() };
    io.to(rooms.user(payload.toUserId)).emit(SOCKET_EVENTS.CHAT_MESSAGE, envelope);
    if (payload.orderId) io.to(rooms.order(payload.orderId)).emit(SOCKET_EVENTS.CHAT_MESSAGE, envelope);
  });
}
