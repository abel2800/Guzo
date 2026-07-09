package et.guzo.web.dto;

public record PickupVerifyResponse(String packageId, String trackingNumber, String qrCode, boolean valid) {}
