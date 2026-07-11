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

export function isWalletNotification(type: string): boolean {
  return /WALLET|TOP.?UP|CREDIT|REFUND/i.test(type);
}

export function isPromoNotification(type: string): boolean {
  return /PROMO|OFFER|COUPON/i.test(type);
}

/** Web dashboard deep link (Next.js paths). */
export function notificationHref(
  role: string,
  notification: { type: string; body: string },
): string | null {
  if (isSupportNotification(notification.type)) {
    if (role === 'customer') return '/dashboard/customer/support';
    if (role === 'support') return '/dashboard/support/tickets';
    return null;
  }
  if (isWalletNotification(notification.type)) {
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

export type MobileAppSlug = 'customer' | 'driver' | 'merchant' | 'branch';

/**
 * Expo Router path for a notification tap. Paths with `?ref=` need a follow-up
 * `trackOrder(ref)` call when the screen requires an order id.
 */
export function notificationMobileRoute(
  app: MobileAppSlug,
  notification: { type: string; body: string },
): string | null {
  if (isSupportNotification(notification.type)) {
    if (app === 'customer') return '/support';
    if (app === 'driver' || app === 'merchant') return '/support';
    return null;
  }
  if (isWalletNotification(notification.type)) {
    if (app === 'customer') return '/wallet';
    return null;
  }
  if (isPromoNotification(notification.type)) {
    if (app === 'customer') return '/loyalty';
    return null;
  }
  const ref = extractTrackingReference(notification.body);
  if (!ref) {
    if (isOrderNotification(notification.type)) {
      if (app === 'customer') return '/(tabs)/orders';
      if (app === 'driver') return '/(tabs)/deliveries';
      if (app === 'merchant') return '/(tabs)/orders';
      if (app === 'branch') return '/(tabs)/receive';
    }
    return null;
  }
  if (app === 'customer') return `/track?ref=${encodeURIComponent(ref)}`;
  if (app === 'driver') return '/(tabs)/deliveries';
  if (app === 'merchant') return '/(tabs)/orders';
  if (app === 'branch') return '/(tabs)/receive';
  return null;
}
