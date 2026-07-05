import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  status: 'UNREAD' | 'READ';
  readAt?: string | null;
  createdAt: string;
}

export async function listNotifications(params: { page?: number; limit?: number; unread?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.unread) qs.set('unread', 'true');
  const { data } = await api.get<ApiResponse<Notification[]>>(`/notifications?${qs}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta as { unreadCount?: number; total?: number } };
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data } = await api.post<ApiResponse<{ success: boolean }>>('/notifications/read-all');
  if (!data.success) throw new Error(data.message);
}
