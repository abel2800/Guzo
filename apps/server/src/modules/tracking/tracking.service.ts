import { trackingRepository, TrackingRepository } from './tracking.repository.js';
import type { RecordLocationDto } from './tracking.dto.js';
import { ApiError } from '../../utils/ApiError.js';
import { emitToOrder, emitToAdmins } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';

export class TrackingService {
  constructor(private readonly repo: TrackingRepository = trackingRepository) {}

  timeline(orderId: string) {
    return this.repo.timeline(orderId);
  }

  async recordLocation(userId: string, dto: RecordLocationDto) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.forbidden('Only drivers can record location');

    const ping = await this.repo.recordPing({
      driverId: driver.id,
      deliveryId: dto.deliveryId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
    });
    await this.repo.updateDriverLocation(driver.id, dto.latitude, dto.longitude);

    const payload = {
      driverId: driver.id,
      orderId: dto.orderId,
      lat: dto.latitude,
      lng: dto.longitude,
      heading: dto.heading,
      speed: dto.speed,
      recordedAt: ping.recordedAt.toISOString(),
    };
    if (dto.orderId) emitToOrder(dto.orderId, SOCKET_EVENTS.ORDER_TRACKING, payload);
    emitToAdmins(SOCKET_EVENTS.DRIVER_LOCATION, payload);
    eventBus.publish(DOMAIN_EVENTS.DRIVER_LOCATION_UPDATED, payload);
    return ping;
  }

  async history(userId: string) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.forbidden('Only drivers have a location history');
    return this.repo.locationHistory(driver.id);
  }
}

export const trackingService = new TrackingService();
