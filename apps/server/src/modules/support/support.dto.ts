export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateSupportTicketDto {
  subject: string;
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
  isInternal?: boolean;
}
