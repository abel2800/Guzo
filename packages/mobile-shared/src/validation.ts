export const PASSWORD_HINT = 'At least 8 characters with a letter and a number.';

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return null;
}

type ApiErrorBody = {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

export function formatApiError(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof Error && !isAxiosLike(error)) {
    return error.message || fallback;
  }

  const body = extractErrorBody(error);
  if (body?.errors?.length) {
    return body.errors
      .map((e) => (e.field && e.field !== 'unknown' ? `${humanizeField(e.field)}: ${e.message}` : e.message))
      .filter(Boolean)
      .join('. ');
  }
  if (body?.message) return body.message;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function isAxiosLike(error: Error): boolean {
  return 'isAxiosError' in error || 'response' in error;
}

function extractErrorBody(error: unknown): ApiErrorBody | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('response' in error) {
    const data = (error as { response?: { data?: ApiErrorBody } }).response?.data;
    if (data && typeof data === 'object') return data;
  }
  if ('errors' in error || 'message' in error) {
    return error as ApiErrorBody;
  }
  return undefined;
}

function humanizeField(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
