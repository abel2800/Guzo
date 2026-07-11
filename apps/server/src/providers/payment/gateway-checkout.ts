import { env } from '../../config/env.js';
import type { CreateChargeInput, ChargeResult } from './payment.interface.js';

const REDIRECT_METHODS = new Set(['TELEBIRR', 'CBE', 'CHAPA', 'CARD']);

export function isRedirectPaymentMethod(method: string): boolean {
  return REDIRECT_METHODS.has(method.toUpperCase());
}

export function buildCheckoutRedirectUrl(
  method: string,
  reference: string,
  amount: number,
  currency: string,
): string {
  const base = (process.env.PAYMENT_CHECKOUT_URL ?? `${env.publicUrl}/checkout`).replace(/\/$/, '');
  const params = new URLSearchParams({
    ref: reference,
    amount: String(amount),
    currency,
  });
  return `${base}/${method.toLowerCase()}?${params.toString()}`;
}

export function createRedirectCharge(method: string, input: CreateChargeInput): ChargeResult {
  const redirectUrl = buildCheckoutRedirectUrl(method, input.reference, input.amount, input.currency);
  return {
    provider: method.toLowerCase(),
    providerRef: input.reference,
    status: 'PENDING',
    redirectUrl,
    raw: { awaitingGateway: true, method: method.toUpperCase() },
  };
}
