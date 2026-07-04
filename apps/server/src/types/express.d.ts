import type { Role } from '@delivery/types';

/** Authenticated principal attached to the request by the auth middleware. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
  permissions: string[];
  sessionId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
