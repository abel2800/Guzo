// Domain types for the payments module.
export interface PaymentListResult<T> {
  items: T[];
  total: number;
}
