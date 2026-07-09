export type CreatePaymentDto = Record<string, unknown>;
export type UpdatePaymentDto = Record<string, unknown>;

export interface RefundPaymentDto {
  amount?: number;
  reason?: string;
}
