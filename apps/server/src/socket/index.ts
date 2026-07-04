import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { registerTrackingHandlers } from './handlers/tracking.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import { registerPresenceHandlers } from './handlers/presence.handler.js';

let io: SocketIOServer | null = null;

/** Room helpers keep emit targets consistent across the app. */
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  order: (orderId: string) => `order:${orderId}`,
  driver: (driverId: string) => `driver:${driverId}`,
  admins: () => 'role:admins',
};

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  // Authenticate every socket using the JWT access token.
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      if (!token) return next(new Error('Authentication required'));
      const claims = verifyAccessToken(token);
      socket.data.userId = claims.sub;
      socket.data.roles = claims.roles;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const roles = (socket.data.roles as string[]) ?? [];
    socket.join(rooms.user(userId));
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) socket.join(rooms.admins());
    logger.debug(`socket connected: user=${userId} id=${socket.id}`);

    registerTrackingHandlers(io!, socket);
    registerChatHandlers(io!, socket);
    registerPresenceHandlers(io!, socket);

    socket.on('disconnect', () => logger.debug(`socket disconnected: ${socket.id}`));
  });

  logger.info('Socket.IO initialized');
  return io;
}

/** Access the io instance from services to emit server-initiated events. */
export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

/** Convenience emit helpers used by services. */
export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(rooms.user(userId)).emit(event, payload);
}
export function emitToOrder(orderId: string, event: string, payload: unknown) {
  io?.to(rooms.order(orderId)).emit(event, payload);
}
export function emitToAdmins(event: string, payload: unknown) {
  io?.to(rooms.admins()).emit(event, payload);
}
