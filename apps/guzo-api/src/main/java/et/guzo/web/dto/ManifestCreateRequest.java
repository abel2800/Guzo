package et.guzo.web.dto;

public record ManifestCreateRequest(String originWarehouseId, String destinationWarehouseId, String driverId) {}
