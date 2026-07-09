import { prisma } from '@delivery/database';

const delegate = (prisma as any).role;

export interface RoleListParams {
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export class RoleRepository {
  async list(params: RoleListParams) {
    const searchFields = ["name","description"];
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

  create(data: any) {
    return delegate.create({ data });
  }

  update(id: string, data: any) {
    return delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return delegate.delete({ where: { id } });
  }
}

export const rolesRepository = new RoleRepository();
