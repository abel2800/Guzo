package et.guzo.web.dto;

import et.guzo.domain.enums.VehicleLogType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record VehicleLogRequest(
    @NotNull VehicleLogType type,
    BigDecimal odometerKm,
    BigDecimal amount,
    String note
) {}
