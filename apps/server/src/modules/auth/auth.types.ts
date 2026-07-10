import type { Role, LoginResponse, RegisterResponse } from '@delivery/types';

export type { LoginResponse, RegisterResponse };

export interface AuthenticatedPrincipal {
  id: string;
  email: string;
  roles: Role[];
  permissions: string[];
}
