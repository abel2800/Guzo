export const ORDER_MESSAGES = {
  CREATED: 'Order created',
  FETCHED: 'Orders fetched',
  FOUND: 'Order found',
  UPDATED: 'Order updated',
  CANCELLED: 'Order cancelled',
  STATUS_UPDATED: 'Order status updated',
  ASSIGNED: 'Driver assigned',
} as const;

export const ORDER_SORTABLE_FIELDS = ['createdAt', 'totalAmount', 'status'] as const;
