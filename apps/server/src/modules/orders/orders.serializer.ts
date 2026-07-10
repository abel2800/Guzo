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

export function serializeOrder<T extends OrderRow>(order: T): T {
  if (!order.delivery) return order;

  const delivery = order.delivery;
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

  return { ...order, delivery: serializedDelivery };
}

export function serializeOrders<T extends OrderRow>(orders: T[]): T[] {
  return orders.map(serializeOrder);
}
