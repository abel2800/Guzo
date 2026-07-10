/** Normalize Ethiopian phone numbers to E.164 (+251…). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return raw.trim();
}

/** All common stored variants for the same physical number. */
export function phoneLookupVariants(raw: string): string[] {
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, '');
  const variants = new Set<string>([raw.trim(), normalized]);

  if (digits.startsWith('251') && digits.length >= 12) {
    const local = digits.slice(3);
    variants.add(`+${digits}`);
    variants.add(`0${local}`);
    variants.add(local);
  } else if (digits.length === 10 && digits.startsWith('0')) {
    variants.add(digits);
    variants.add(`+251${digits.slice(1)}`);
    variants.add(digits.slice(1));
  } else if (digits.length === 9) {
    variants.add(digits);
    variants.add(`0${digits}`);
    variants.add(`+251${digits}`);
  }

  return [...variants].filter(Boolean);
}

export function isWalkInEmail(email: string): boolean {
  return email.endsWith('@walkin.guzo.local');
}
