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
  /** Hosted checkout URL for Telebirr, CBE, Chapa, etc. */
  redirectUrl?: string;
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

export interface PaymentProvider {
  readonly name: string;
  charge(input: CreateChargeInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verify(providerRef: string): Promise<ChargeResult>;
}
