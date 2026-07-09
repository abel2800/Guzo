package et.guzo.web.dto;

public record DriverLocationPayload(
    String driverId,
    String orderId,
    double lat,
    double lng,
    Double heading,
    Double speed,
    String recordedAt
) {}
