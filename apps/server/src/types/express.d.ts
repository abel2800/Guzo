import type { Role } from '@delivery/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
  permissions: string[];
  sessionId?: string;
}

declare global {
    namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
