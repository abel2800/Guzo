// Domain types for the reviews module.
export interface ReviewListResult<T> {
  items: T[];
  total: number;
}
