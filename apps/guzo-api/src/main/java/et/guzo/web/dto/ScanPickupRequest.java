package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ScanPickupRequest(
    @NotBlank String reference,
    Double latitude,
    Double longitude
) {}
