package et.guzo.web.dto;

import et.guzo.domain.entity.ManifestParcel;

public record ManifestParcelResponse(String id, String manifestId, String packageId, String scannedByUserId) {
    public static ManifestParcelResponse from(ManifestParcel p) {
        return new ManifestParcelResponse(p.getId(), p.getManifestId(), p.getPackageId(), p.getScannedByUserId());
    }
}
