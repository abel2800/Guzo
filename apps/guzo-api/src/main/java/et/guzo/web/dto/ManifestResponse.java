package et.guzo.web.dto;

import et.guzo.domain.entity.TransportManifest;

public record ManifestResponse(
    String id, String manifestNumber, String status, String sealNumber,
    String originWarehouseId, String destinationWarehouseId, String driverId
) {
    public static ManifestResponse from(TransportManifest m) {
        return new ManifestResponse(m.getId(), m.getManifestNumber(), m.getStatus().name(), m.getSealNumber(),
            m.getOriginWarehouseId(), m.getDestinationWarehouseId(), m.getDriverId());
    }
}
