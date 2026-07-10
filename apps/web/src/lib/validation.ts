import { z } from 'zod';

export const PASSWORD_HINT = 'At least 8 characters with a letter and a number.';

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/\d/, 'Include a number');

export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Array<{ field?: string; message?: string }> } } })
    ?.response?.data;

  if (data?.errors?.length) {
    return data.errors
      .map((e) => (e.field && e.field !== 'unknown' ? `${e.field}: ${e.message}` : e.message))
      .filter(Boolean)
      .join('. ');
  }

  return data?.message ?? (err instanceof Error ? err.message : fallback);
}
