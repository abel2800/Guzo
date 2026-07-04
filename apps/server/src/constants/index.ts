export { HTTP_STATUS, ERROR_CODES, ROLES, API_PREFIX, UPLOAD_FOLDERS } from '@delivery/config';

/** Default pagination values used by list endpoints. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;
