import { addressRepository } from './addresses.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export interface AddressInput {
  label?: string;
  type?: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export class AddressService {
  list(userId: string) {
    return addressRepository.listByUser(userId);
  }

  async create(userId: string, dto: AddressInput) {
    if (dto.isDefault) await addressRepository.clearDefault(userId);
    return addressRepository.create({
      userId,
      label: dto.label,
      type: (dto.type as never) ?? 'HOME',
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      line1: dto.line1,
      line2: dto.line2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country ?? 'ET',
      latitude: dto.latitude,
      longitude: dto.longitude,
      isDefault: dto.isDefault ?? false,
    });
  }

  async update(id: string, userId: string, dto: Partial<AddressInput>) {
    const row = await addressRepository.findById(id);
    if (!row || row.userId !== userId) throw ApiError.notFound('Address not found');
    if (dto.isDefault) await addressRepository.clearDefault(userId);
    return addressRepository.update(id, {
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.type ? { type: dto.type as never } : {}),
      ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
      ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
      ...(dto.line1 ? { line1: dto.line1 } : {}),
      ...(dto.line2 !== undefined ? { line2: dto.line2 } : {}),
      ...(dto.city ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.country ? { country: dto.country } : {}),
      ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
      ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
    });
  }

  async remove(id: string, userId: string) {
    const row = await addressRepository.findById(id);
    if (!row || row.userId !== userId) throw ApiError.notFound('Address not found');
    await addressRepository.delete(id);
  }
}

export const addressService = new AddressService();
