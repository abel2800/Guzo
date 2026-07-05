import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TicketPerson {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
}

export interface TicketMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  requester: TicketPerson;
  assignee?: TicketPerson | null;
  messages: TicketMessage[];
}

export interface CreateTicketInput {
  subject: string;
  message?: string;
  category?: string;
  priority?: TicketPriority;
  orderId?: string;
}

export async function listTickets(
  params: { page?: number; limit?: number; status?: string; priority?: string; search?: string } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const { data } = await api.get<ApiResponse<Ticket[]>>(`/support?${qs.toString()}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export function getTicket(id: string): Promise<Ticket> {
  return apiGet<Ticket>(`/support/${id}`);
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data } = await api.post<ApiResponse<Ticket>>('/support', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function addTicketMessage(
  id: string,
  input: { body: string; isInternal?: boolean },
): Promise<TicketMessage> {
  const { data } = await api.post<ApiResponse<TicketMessage>>(`/support/${id}/messages`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateTicket(
  id: string,
  input: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string | null; category?: string },
): Promise<Ticket> {
  const { data } = await api.patch<ApiResponse<Ticket>>(`/support/${id}`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  OPEN: { label: 'Open', variant: 'default' },
  IN_PROGRESS: { label: 'In progress', variant: 'secondary' },
  WAITING_CUSTOMER: { label: 'Waiting on you', variant: 'outline' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
};

export const TICKET_PRIORITY_META: Record<TicketPriority, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  LOW: { label: 'Low', variant: 'outline' },
  MEDIUM: { label: 'Medium', variant: 'secondary' },
  HIGH: { label: 'High', variant: 'default' },
  URGENT: { label: 'Urgent', variant: 'destructive' },
};

export const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
export const TICKET_PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const TICKET_CATEGORIES = ['DELIVERY', 'PAYMENT', 'ACCOUNT', 'PACKAGE', 'OTHER'];
