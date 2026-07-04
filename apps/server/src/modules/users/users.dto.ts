export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export interface AssignRolesDto {
  roles: string[];
}
