import { env } from '../config/env.js';

export function filePublicUrl(storageKey?: string | null): string | null {
  if (!storageKey) return null;
  return `${env.publicUrl}/static/${storageKey.replace(/^uploads\//, '')}`;
}
