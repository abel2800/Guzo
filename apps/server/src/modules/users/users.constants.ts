export const USER_MESSAGES = {
  CREATED: 'User created',
  UPDATED: 'User updated',
  DELETED: 'User deleted',
  FETCHED: 'Users fetched',
  FOUND: 'User found',
  ROLES_UPDATED: 'User roles updated',
} as const;

export const USER_SORTABLE_FIELDS = ['createdAt', 'email', 'firstName', 'lastName', 'status'] as const;
