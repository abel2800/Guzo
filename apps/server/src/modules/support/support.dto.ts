export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateSupportTicketDto {
  subject: string;
  /** First message body describing the issue. */
  message?: string;
  category?: string;
  priority?: TicketPriority;
  orderId?: string;
}

export interface UpdateSupportTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  category?: string;
}

export interface AddTicketMessageDto {
  body: string;
  /** Internal notes are only visible to agents. */
  isInternal?: boolean;
}
