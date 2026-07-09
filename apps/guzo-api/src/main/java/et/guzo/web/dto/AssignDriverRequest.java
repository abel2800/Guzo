package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignDriverRequest(@NotBlank String driverId, String vehicleId) {}
