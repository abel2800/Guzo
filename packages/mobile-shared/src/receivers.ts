import { apiGet } from './api';

export interface ReceiverLookup {
  found: boolean;
  userId?: string | null;
  guzoId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  matchedBy?: string | null;
}

export function lookupReceiver(params: { phone?: string; guzoId?: string }): Promise<ReceiverLookup> {
  const q = new URLSearchParams();
  if (params.phone) q.set('phone', params.phone);
  if (params.guzoId) q.set('guzoId', params.guzoId);
  return apiGet<ReceiverLookup>(`/receivers/lookup?${q.toString()}`);
}
