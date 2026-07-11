import { filePublicUrl } from '../../utils/file-url.js';

type OrderRow = Record<string, unknown> & {
  delivery?: {
    driver?: {
      user?: { avatar?: { storageKey?: string | null } | null } & Record<string, unknown>;
    } & Record<string, unknown>;
    vehicle?: {
      id: string;
      type: string;
      plateNumber: string;
      brand?: string | null;
      model?: string | null;
      color?: string | null;
      photoFileId?: string | null;
      photo?: { storageKey?: string | null } | null;
    } | null;
  } & Record<string, unknown>;
};

type PaymentRow = { metadata?: { checkoutUrl?: string } | null } & Record<string, unknown>;

function serializePayment(payment: PaymentRow | null | undefined) {
  if (!payment) return payment;
  const meta = payment.metadata as { checkoutUrl?: string } | null | undefined;
  const checkoutUrl = meta?.checkoutUrl;
  if (!checkoutUrl) return payment;
  const { metadata: _meta, ...rest } = payment;
  return { ...rest, checkoutUrl };
}

export function serializeOrder<T extends OrderRow>(order: T): T {
  const withPayment = order.payment
    ? { ...order, payment: serializePayment(order.payment as PaymentRow) }
    : order;

  if (!withPayment.delivery) return withPayment as T;

  const delivery = withPayment.delivery;
  const driver = delivery.driver;
  const user = driver?.user;
  const vehicle = delivery.vehicle;

  const serializedDelivery = {
    ...delivery,
    driver: driver
      ? {
          ...driver,
          user: user
            ? {
                ...user,
                avatarUrl: filePublicUrl(user.avatar?.storageKey),
                avatar: undefined,
              }
            : user,
        }
      : driver,
    vehicle: vehicle
      ? {
          id: vehicle.id,
          type: vehicle.type,
          plateNumber: vehicle.plateNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          photoUrl: filePublicUrl(vehicle.photo?.storageKey),
        }
      : null,
  };

  return { ...withPayment, delivery: serializedDelivery } as T;
}

export function serializeOrders<T extends OrderRow>(orders: T[]): T[] {
  return orders.map(serializeOrder);
}
