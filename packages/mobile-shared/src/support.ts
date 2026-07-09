import { apiGet, apiList, apiPatch, apiPost } from './api';

export interface SupportTicket {
  id: string;
  ticketNumber?: string;
  subject: string;
  status: string;
  priority: string;
  category?: string | null;
  createdAt: string;
  updatedAt?: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author?: { id: string; firstName: string; lastName: string; email?: string };
}

export function listSupportTickets(params: { page?: number; limit?: number; status?: string } = {}) {
  return apiList<SupportTicket>('/support', params);
}

export function createSupportTicket(input: {
  subject: string;
  message: string;
  category?: string;
  orderId?: string;
}): Promise<SupportTicket> {
  return apiPost<SupportTicket>('/support', input);
}

export function getSupportTicket(id: string): Promise<SupportTicket> {
  return apiGet<SupportTicket>(`/support/${id}`);
}

export function addSupportMessage(ticketId: string, body: string): Promise<SupportMessage> {
  return apiPost<SupportMessage>(`/support/${ticketId}/messages`, { body });
}

export function updateSupportTicket(id: string, patch: { status?: string; priority?: string }): Promise<SupportTicket> {
  return apiPatch<SupportTicket>(`/support/${id}`, patch);
}
