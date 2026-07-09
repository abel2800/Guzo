package et.guzo.web.dto;

import et.guzo.domain.entity.Address;
import et.guzo.domain.enums.AddressType;

import java.time.Instant;

public record AddressDto(
    String id,
    String label,
    AddressType type,
    String contactName,
    String contactPhone,
    String line1,
    String line2,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isDefault,
    Instant createdAt
) {
    public static AddressDto from(Address a) {
        return new AddressDto(
            a.getId(), a.getLabel(), a.getType(), a.getContactName(), a.getContactPhone(),
            a.getLine1(), a.getLine2(), a.getCity(), a.getState(), a.getPostalCode(),
            a.getCountry(), a.isDefaultAddress(), a.getCreatedAt()
        );
    }
}
