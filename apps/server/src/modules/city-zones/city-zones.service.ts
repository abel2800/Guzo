import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';

export class CityZonesService {
  async list(query: ParsedListQuery): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const where = query.search
      ? { OR: [{ city: { contains: query.search, mode: 'insensitive' as const } }, { zoneName: { contains: query.search, mode: 'insensitive' as const } }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.cityPricingZone.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { city: 'asc' },
      }),
      prisma.cityPricingZone.count({ where }),
    ]);
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string) {
    const item = await prisma.cityPricingZone.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound('City pricing zone not found');
    return item;
  }

  async create(dto: { city: string; zoneName: string; multiplier?: number; isActive?: boolean }) {
    const existing = await prisma.cityPricingZone.findUnique({ where: { city: dto.city } });
    if (existing) throw ApiError.conflict('City zone already exists');
    return prisma.cityPricingZone.create({
      data: {
        city: dto.city,
        zoneName: dto.zoneName,
        multiplier: dto.multiplier ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: { city?: string; zoneName?: string; multiplier?: number; isActive?: boolean }) {
    await this.getById(id);
    if (dto.city) {
      const clash = await prisma.cityPricingZone.findFirst({ where: { city: dto.city, NOT: { id } } });
      if (clash) throw ApiError.conflict('City zone already exists');
    }
    return prisma.cityPricingZone.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getById(id);
    await prisma.cityPricingZone.delete({ where: { id } });
  }
}

export const cityZonesService = new CityZonesService();
