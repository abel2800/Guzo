import { prisma, type Prisma } from '@delivery/database';

export class TrackingRepository {
  timeline(orderId: string) {
    return prisma.trackingEvent.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }

  driverByUserId(userId: string) {
    return prisma.driver.findUnique({ where: { userId } });
  }

  recordPing(data: Prisma.GpsLocationUncheckedCreateInput) {
    return prisma.gpsLocation.create({ data });
  }

  updateDriverLocation(driverId: string, lat: number, lng: number) {
    return prisma.driver.update({
      where: { id: driverId },
      data: { currentLat: lat, currentLng: lng, lastLocationAt: new Date() },
    });
  }

  locationHistory(driverId: string, take = 100) {
    return prisma.gpsLocation.findMany({
      where: { driverId },
      orderBy: { recordedAt: 'desc' },
      take,
    });
  }
}

export const trackingRepository = new TrackingRepository();
