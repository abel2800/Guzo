package et.guzo.web.dto;

import et.guzo.domain.enums.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpsertVehicleRequest(
    @NotNull VehicleType type,
    @NotBlank String plateNumber,
    String brand,
    String model,
    String color
) {}
