package et.guzo.web.dto;

public record AddressInput(
    String line1,
    String line2,
    String city,
    String state,
    String country,
    String postalCode,
    Double latitude,
    Double longitude,
    String contactName,
    String contactPhone
) {}
