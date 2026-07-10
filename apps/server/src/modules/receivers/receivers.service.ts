import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { phoneLookupVariants } from '../../utils/phone.js';

export class ReceiversService {
  async lookup(phone?: string, guzoId?: string) {
    const trimmedPhone = phone?.trim();
    const trimmedGuzo = guzoId?.trim();

    if (!trimmedPhone && !trimmedGuzo) {
      throw ApiError.badRequest('Provide phone or guzoId');
    }

    if (trimmedGuzo) {
      const byGuzo = await prisma.user.findFirst({
        where: { OR: [{ id: trimmedGuzo }, { customer: { customerCode: trimmedGuzo } }] },
        select: { id: true, firstName: true, lastName: true, phone: true, customer: { select: { customerCode: true } } },
      });
      if (byGuzo) {
        return {
          found: true,
          userId: byGuzo.id,
          guzoId: byGuzo.customer?.customerCode ?? byGuzo.id,
          firstName: byGuzo.firstName,
          lastName: byGuzo.lastName,
          phone: byGuzo.phone,
          matchedBy: 'guzoId',
        };
      }
    }

    if (trimmedPhone) {
      const variants = phoneLookupVariants(trimmedPhone);
      const byPhone = await prisma.user.findFirst({
        where: { phone: { in: variants } },
        select: { id: true, firstName: true, lastName: true, phone: true, customer: { select: { customerCode: true } } },
      });
      if (byPhone) {
        return {
          found: true,
          userId: byPhone.id,
          guzoId: byPhone.customer?.customerCode ?? byPhone.id,
          firstName: byPhone.firstName,
          lastName: byPhone.lastName,
          phone: byPhone.phone,
          matchedBy: 'phone',
        };
      }
    }

    return { found: false };
  }
}

export const receiversService = new ReceiversService();
