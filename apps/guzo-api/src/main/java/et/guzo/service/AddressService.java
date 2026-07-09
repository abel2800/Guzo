package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Address;
import et.guzo.domain.enums.AddressType;
import et.guzo.repository.AddressRepository;
import et.guzo.util.IdUtil;
import et.guzo.web.dto.AddressDto;
import et.guzo.web.dto.AddressRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;

    @Transactional(readOnly = true)
    public List<AddressDto> list(String userId) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(AddressDto::from).toList();
    }

    @Transactional
    public AddressDto create(String userId, AddressRequest dto) {
        Instant now = Instant.now();
        if (Boolean.TRUE.equals(dto.isDefault())) {
            clearDefaults(userId, now);
        }
        Address address = new Address();
        address.setId(IdUtil.cuid());
        address.setUserId(userId);
        apply(address, dto);
        if (addressRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty()) {
            address.setDefaultAddress(true);
        }
        address.setCreatedAt(now);
        address.setUpdatedAt(now);
        return AddressDto.from(addressRepository.save(address));
    }

    @Transactional
    public AddressDto update(String userId, String addressId, AddressRequest dto) {
        Address address = loadOwned(userId, addressId);
        Instant now = Instant.now();
        if (Boolean.TRUE.equals(dto.isDefault())) {
            clearDefaults(userId, now);
            address.setDefaultAddress(true);
        }
        apply(address, dto);
        address.setUpdatedAt(now);
        return AddressDto.from(addressRepository.save(address));
    }

    @Transactional
    public void delete(String userId, String addressId) {
        Address address = loadOwned(userId, addressId);
        addressRepository.delete(address);
    }

    private Address loadOwned(String userId, String addressId) {
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> ApiException.notFound("Address not found"));
        if (!userId.equals(address.getUserId())) {
            throw ApiException.forbidden("Not your address");
        }
        return address;
    }

    private void clearDefaults(String userId, Instant now) {
        addressRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(a -> {
            a.setDefaultAddress(false);
            a.setUpdatedAt(now);
            addressRepository.save(a);
        });
    }

    private void apply(Address address, AddressRequest dto) {
        if (dto.label() != null) address.setLabel(dto.label());
        if (dto.type() != null) address.setType(dto.type());
        if (dto.contactName() != null) address.setContactName(dto.contactName());
        if (dto.contactPhone() != null) address.setContactPhone(dto.contactPhone());
        if (dto.line1() != null) address.setLine1(dto.line1());
        if (dto.line2() != null) address.setLine2(dto.line2());
        if (dto.city() != null) address.setCity(dto.city());
        if (dto.state() != null) address.setState(dto.state());
        if (dto.postalCode() != null) address.setPostalCode(dto.postalCode());
        if (dto.country() != null) address.setCountry(dto.country());
        if (dto.isDefault() != null) address.setDefaultAddress(dto.isDefault());
        if (address.getType() == null) address.setType(AddressType.OTHER);
    }
}
