package et.guzo.web.dto;

public record ManifestScanRequest(String packageId, String trackingNumber, String scannedByUserId) {}
