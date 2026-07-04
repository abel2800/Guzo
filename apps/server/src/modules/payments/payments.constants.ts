export const PAYMENTS_MESSAGES = {
  FETCHED: 'Payment list fetched',
  FOUND: 'Payment found',
  CREATED: 'Payment created',
  UPDATED: 'Payment updated',
  DELETED: 'Payment deleted',
  REFUNDED: 'Refund issued',
} as const;

export const PAYMENT_SEARCH_FIELDS = ["reference","providerRef"] as const;
