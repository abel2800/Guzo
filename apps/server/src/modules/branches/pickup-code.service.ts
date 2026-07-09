import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';

function randomPin(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

export async function assignPickupCodes(packageId: string) {
  const existing = await prisma.package.findUnique({ where: { id: packageId } });
  if (!existing) throw ApiError.notFound('Package not found');

  let pin = randomPin();
  for (let i = 0; i < 10; i++) {
    const clash = await prisma.package.findFirst({ where: { pickupPin: pin, NOT: { id: packageId } } });
    if (!clash) break;
    pin = randomPin();
  }

  return prisma.package.update({
    where: { id: packageId },
    data: {
      pickupPin: pin,
      qrCode: `GUZO:${existing.trackingNumber}:${pin}`,
    },
  });
}

export async function verifyPickup(reference: string, pin?: string | null) {
  let tracking = reference.trim();
  let resolvedPin = pin?.trim() ?? null;

  if (!tracking && resolvedPin) {
    const byPin = await prisma.package.findFirst({ where: { pickupPin: resolvedPin } });
    if (!byPin) throw ApiError.notFound('Parcel not found');
    return byPin;
  }

  if (tracking.startsWith('GUZO:')) {
    const parts = tracking.split(':');
    if (parts.length >= 3) {
      tracking = parts[1]!;
      resolvedPin = parts[2]!;
    }
  }

  const pkg =
    (await prisma.package.findUnique({ where: { trackingNumber: tracking } })) ??
    (resolvedPin ? await prisma.package.findFirst({ where: { pickupPin: resolvedPin } }) : null);

  if (!pkg) throw ApiError.notFound('Parcel not found');
  if (resolvedPin && pkg.pickupPin && pkg.pickupPin !== resolvedPin) {
    throw ApiError.badRequest('Invalid pickup PIN');
  }
  return pkg;
}
