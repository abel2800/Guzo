package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.ManifestParcel;
import et.guzo.domain.entity.TransportManifest;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.TransportManifestService;
import et.guzo.web.dto.ManifestCreateRequest;
import et.guzo.web.dto.ManifestParcelResponse;
import et.guzo.web.dto.ManifestResponse;
import et.guzo.web.dto.ManifestScanRequest;
import et.guzo.web.dto.ManifestSealRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/manifests")
@RequiredArgsConstructor
public class ManifestController {

    private final TransportManifestService manifestService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
        @RequestParam String warehouseId,
        @RequestParam(defaultValue = "outbound") String scope
    ) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        return ApiResponse.ok(manifestService.list(warehouseId, scope));
    }

    @GetMapping("/live-trucks")
    public ApiResponse<List<Map<String, Object>>> liveTrucks() {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        return ApiResponse.ok(manifestService.liveTrucks());
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable String id) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        return ApiResponse.ok(manifestService.getDetail(id));
    }

    @PostMapping
    public ApiResponse<ManifestResponse> create(@Valid @RequestBody ManifestCreateRequest body) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        TransportManifest m = manifestService.createDraft(
            body.originWarehouseId(),
            body.destinationWarehouseId(),
            body.driverId()
        );
        return ApiResponse.ok(ManifestResponse.from(m), "Manifest created");
    }

    @PostMapping("/{id}/scan")
    public ApiResponse<ManifestParcelResponse> scan(
        @PathVariable String id,
        @Valid @RequestBody ManifestScanRequest body
    ) {
        var user = SecurityUtil.requireUser();
        RoleChecker.requireWarehouse(user);
        ManifestParcel row = manifestService.scanParcel(id, body.packageId(), body.trackingNumber(), user.getId());
        return ApiResponse.ok(ManifestParcelResponse.from(row), "Parcel scanned onto manifest");
    }

    @PostMapping("/{id}/depart")
    public ApiResponse<ManifestResponse> depart(@PathVariable String id, @Valid @RequestBody ManifestSealRequest body) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        TransportManifest m = manifestService.sealAndDepart(id, body.sealNumber());
        return ApiResponse.ok(ManifestResponse.from(m), "Manifest departed");
    }

    @PostMapping("/{id}/arrive")
    public ApiResponse<ManifestResponse> arrive(@PathVariable String id) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        TransportManifest m = manifestService.markArrived(id);
        return ApiResponse.ok(ManifestResponse.from(m), "Manifest arrived");
    }

    @PostMapping("/{id}/unload")
    public ApiResponse<Map<String, Object>> unload(
        @PathVariable String id,
        @RequestBody Map<String, String> body
    ) {
        var user = SecurityUtil.requireUser();
        RoleChecker.requireWarehouse(user);
        return ApiResponse.ok(
            manifestService.unloadScan(id, body.get("trackingNumber"), user),
            "Unload scan recorded"
        );
    }

    @GetMapping("/{id}/parcels")
    public ApiResponse<List<Map<String, Object>>> parcels(@PathVariable String id) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        return ApiResponse.ok(manifestService.listParcelDetails(id));
    }

    @GetMapping("/{id}/unload-status")
    public ApiResponse<Map<String, Object>> unloadStatus(@PathVariable String id) {
        RoleChecker.requireWarehouse(SecurityUtil.requireUser());
        return ApiResponse.ok(manifestService.unloadStatus(id));
    }
}
