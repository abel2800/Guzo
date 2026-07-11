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

export function notificationHref(
  role: string,
  notification: { type: string; body: string },
): string | null {
  if (isSupportNotification(notification.type)) {
    if (role === 'customer') return '/dashboard/customer/support';
    if (role === 'support') return '/dashboard/support/tickets';
    return null;
  }
  if (/WALLET|TOP.?UP|CREDIT|REFUND/i.test(notification.type)) {
    if (role === 'customer' || role === 'merchant') return `/dashboard/${role}/wallet`;
    return null;
  }
  const ref = extractTrackingReference(notification.body);
  if (!ref) return null;
  if (role === 'driver') return `/dashboard/driver/accepted`;
  if (role === 'customer') return `/dashboard/customer/track?ref=${encodeURIComponent(ref)}`;
  if (role === 'merchant') return `/dashboard/merchant/orders`;
  if (role === 'branch') return `/dashboard/branch/inventory`;
  return `/track/${encodeURIComponent(ref)}`;
}

function isSupportNotification(type: string): boolean {
  return /SUPPORT|TICKET/i.test(type);
}
