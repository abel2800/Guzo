package et.guzo.web.dto;

import jakarta.validation.constraints.NotNull;

public record RecordLocationRequest(
    String orderId,
    String deliveryId,
    @NotNull Double latitude,
    @NotNull Double longitude,
    Double speed,
    Double heading,
    Double accuracy
) {}
