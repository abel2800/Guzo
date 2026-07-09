import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { randomBytes } from 'node:crypto';

export interface CreateBranchDto {
  code: string;
  name: string;
  line1: string;
  city: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: string;
  warehouseId?: string;
}

export interface UpdateBranchDto extends Partial<CreateBranchDto> {
  isActive?: boolean;
  queueLevel?: number;
}

export class BranchesService {
  async listActive(city?: string) {
    return prisma.guzoBranch.findMany({
      where: { isActive: true, ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async listAll(includeInactive = false) {
    return prisma.guzoBranch.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const branch = await prisma.guzoBranch.findUnique({ where: { id } });
    if (!branch) throw ApiError.notFound('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const existing = await prisma.guzoBranch.findUnique({ where: { code: dto.code } });
    if (existing) throw ApiError.conflict('Branch code already exists');

    const id = `br_${randomBytes(6).toString('hex')}`;
    return prisma.guzoBranch.create({
      data: {
        id,
        code: dto.code,
        name: dto.name,
        line1: dto.line1,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'ET',
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        openingHours: dto.openingHours,
        warehouseId: dto.warehouseId,
      },
    });
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.getById(id);
    if (dto.code) {
      const clash = await prisma.guzoBranch.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (clash) throw ApiError.conflict('Branch code already exists');
    }
    return prisma.guzoBranch.update({ where: { id }, data: dto });
  }
}

export const branchesService = new BranchesService();
