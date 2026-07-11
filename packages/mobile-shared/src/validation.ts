import type { CreateOrderInput } from './types';

export const PASSWORD_HINT = 'At least 8 characters with a letter and a number.';

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  return null;
}

const PHONE_RE = /^(\+251|0)?[79]\d{8}$/;

export function validateEthiopianPhone(phone: string): string | null {
  const digits = phone.replace(/\s+/g, '');
  if (!digits) return 'Recipient phone is required';
  if (!PHONE_RE.test(digits)) return 'Enter a valid Ethiopian mobile number';
  return null;
}

export function validateBulkOrderRow(row: CreateOrderInput, index: number): string | null {
  const label = `Row ${index + 1}`;
  if (!row.pickup.line1?.trim() || row.pickup.line1.trim().length < 3) {
    return `${label}: pickup address is required`;
  }
  if (!row.pickup.city?.trim()) return `${label}: pickup city is required`;
  if (!row.dropoff.line1?.trim() || row.dropoff.line1.trim().length < 3) {
    return `${label}: drop-off address is required`;
  }
  if (!row.dropoff.city?.trim()) return `${label}: drop-off city is required`;
  const phoneErr = validateEthiopianPhone(row.dropoff.contactPhone ?? '');
  if (phoneErr) return `${label}: ${phoneErr}`;
  const weight = row.package?.weightKg ?? 0;
  if (!Number.isFinite(weight) || weight <= 0) return `${label}: weight must be greater than 0`;
  if (weight > 50) return `${label}: weight cannot exceed 50 kg`;
  return null;
}

export function validateBulkOrders(rows: CreateOrderInput[]): string | null {
  if (!rows.length) return 'Add at least one shipment';
  if (rows.length > 200) return 'Maximum 200 shipments per upload';
  for (let i = 0; i < rows.length; i++) {
    const err = validateBulkOrderRow(rows[i]!, i);
    if (err) return err;
  }
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
