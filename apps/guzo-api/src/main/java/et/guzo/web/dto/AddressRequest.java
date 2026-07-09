package et.guzo.web.dto;

import et.guzo.domain.enums.AddressType;

public record AddressRequest(
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
    Boolean isDefault
) {}
