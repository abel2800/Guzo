/** Extract order/tracking reference from notification text for deep links. */
export function extractTrackingReference(text: string): string | null {
  const trk = text.match(/\bTRK-[A-Z0-9]+\b/i)?.[0];
  if (trk) return trk;
  const ord = text.match(/\bORD-\d{4}-[A-Z0-9]+\b/i)?.[0];
  if (ord) return ord;
  return null;
}

export function isOrderNotification(type: string): boolean {
  return /ORDER|PARCEL|DELIVER|PICKUP|DRIVER|READY|INCOMING/i.test(type);
}

export function isSupportNotification(type: string): boolean {
  return /SUPPORT|TICKET/i.test(type);
}
