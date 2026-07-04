import { prisma, type Prisma } from '@delivery/database';

export class AddressRepository {
  listByUser(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findById(id: string) {
    return prisma.address.findUnique({ where: { id } });
  }

  create(data: Prisma.AddressUncheckedCreateInput) {
    return prisma.address.create({ data });
  }

  update(id: string, data: Prisma.AddressUpdateInput) {
    return prisma.address.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.address.delete({ where: { id } });
  }

  clearDefault(userId: string) {
    return prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }
}

export const addressRepository = new AddressRepository();
