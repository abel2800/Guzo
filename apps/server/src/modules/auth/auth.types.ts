import type { Role, LoginResponse } from '@delivery/types';

export type { LoginResponse };

export interface AuthenticatedPrincipal {
  id: string;
  email: string;
  roles: Role[];
  permissions: string[];
}
