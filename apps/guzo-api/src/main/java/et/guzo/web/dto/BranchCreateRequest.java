package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record BranchCreateRequest(
    @NotBlank String code,
    @NotBlank String name,
    @NotBlank String line1,
    @NotBlank String city,
    String state,
    String country,
    Double latitude,
    Double longitude,
    String phone,
    String openingHours,
    Integer queueLevel,
    String warehouseId
) {}
