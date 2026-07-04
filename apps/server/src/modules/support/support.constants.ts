export const SUPPORT_MESSAGES = {
  FETCHED: 'Support tickets fetched',
  FOUND: 'Support ticket found',
  CREATED: 'Support ticket created',
  UPDATED: 'Support ticket updated',
  DELETED: 'Support ticket deleted',
  MESSAGE_ADDED: 'Reply posted',
} as const;

export const SUPPORTTICKET_SEARCH_FIELDS = ['ticketNumber', 'subject'] as const;

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const TICKET_CATEGORIES = ['DELIVERY', 'PAYMENT', 'ACCOUNT', 'PACKAGE', 'OTHER'] as const;
