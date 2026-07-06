import { apiPost, apiGet, apiList, apiPatch, getApi } from './api';

export interface PushTokenInput {
  token: string;
  platform: 'ios' | 'android';
  appSlug: 'customer' | 'driver' | 'merchant';
}

export function registerPushToken(input: PushTokenInput): Promise<unknown> {
  return apiPost('/push-tokens', input);
}

export function removePushToken(token: string): Promise<void> {
  return getApi().delete('/push-tokens', { data: { token } }).then(() => undefined);
}

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
}

export async function listNotifications(params: { page?: number; limit?: number; unread?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.unread) qs.set('unread', 'true');
  return apiList<MobileNotification>(`/notifications?${qs}`);
}

export function markNotificationRead(id: string): Promise<MobileNotification> {
  return apiPatch<MobileNotification>(`/notifications/${id}/read`);
}
