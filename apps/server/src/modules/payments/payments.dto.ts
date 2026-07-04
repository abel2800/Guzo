export type CreatePaymentDto = Record<string, unknown>;
export type UpdatePaymentDto = Record<string, unknown>;

export interface RefundPaymentDto {
  /** Amount to refund; defaults to the full remaining (unrefunded) amount. */
  amount?: number;
  reason?: string;
}
