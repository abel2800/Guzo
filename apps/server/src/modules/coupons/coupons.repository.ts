import { prisma } from '@delivery/database';

/**
 * Repository for coupons. Generic CRUD over the Prisma "coupon" delegate.
 * The delegate is accessed dynamically so this stays small; tighten types as
 * the module matures (mirror the fully-typed users/auth repositories).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const delegate = (prisma as any).coupon;

export interface CouponListParams {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
}

export class CouponRepository {
  async list(params: CouponListParams) {
    const searchFields = ["code"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { ...(params.filters ?? {}) };
    if (params.search && searchFields.length) {
      where.OR = searchFields.map((f) => ({ [f]: { contains: params.search, mode: 'insensitive' } }));
    }
    const orderBy = params.sortBy ? { [params.sortBy]: params.sortOrder } : { createdAt: params.sortOrder };
    const [items, total] = await Promise.all([
      delegate.findMany({ where, skip: params.skip, take: params.take, orderBy }),
      delegate.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return delegate.findUnique({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(data: any) {
    return delegate.create({ data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(id: string, data: any) {
    return delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return delegate.delete({ where: { id } });
  }
}

export const couponsRepository = new CouponRepository();
