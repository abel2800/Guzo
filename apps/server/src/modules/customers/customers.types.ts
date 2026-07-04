// Domain types for the customers module.
export interface CustomerListResult<T> {
  items: T[];
  total: number;
}
