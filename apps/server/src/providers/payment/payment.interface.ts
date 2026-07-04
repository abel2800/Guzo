export interface CreateChargeInput {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeResult {
  provider: string;
  providerRef: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  raw?: Record<string, unknown>;
}

export interface RefundInput {
  providerRef: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  provider: string;
  providerRef: string;
  status: 'REFUNDED' | 'FAILED';
}

/**
 * Payment provider abstraction. The fake provider is used locally. Implement
 * this interface for Stripe / Chapa / Telebirr / PayPal / Apple Pay / Google Pay
 * later and select via PAYMENT_PROVIDER - business code never changes.
 */
export interface PaymentProvider {
  readonly name: string;
  charge(input: CreateChargeInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verify(providerRef: string): Promise<ChargeResult>;
}
