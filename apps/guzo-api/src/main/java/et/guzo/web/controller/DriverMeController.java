package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.TransportManifest;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.DriverOpsService;
import et.guzo.web.dto.VehicleLogRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/drivers/me")
@RequiredArgsConstructor
public class DriverMeController {

    private final DriverOpsService driverOpsService;

    private void requireDriver() {
        var user = SecurityUtil.requireUser();
        if (!RoleChecker.hasAnyRole(user, "DRIVER")) {
            throw et.guzo.common.ApiException.forbidden("Driver access required");
        }
    }

    @GetMapping("/manifests")
    public ApiResponse<List<Map<String, Object>>> manifests() {
        requireDriver();
        return ApiResponse.ok(driverOpsService.listManifests(SecurityUtil.requireUser().getId()), "Driver manifests");
    }

    @GetMapping("/manifests/{manifestId}")
    public ApiResponse<Map<String, Object>> manifestDetail(@PathVariable String manifestId) {
        requireDriver();
        return ApiResponse.ok(driverOpsService.getManifest(SecurityUtil.requireUser().getId(), manifestId), "Manifest detail");
    }

    @PostMapping("/manifests/{manifestId}/scan")
    public ApiResponse<Object> scan(@PathVariable String manifestId, @RequestBody Map<String, String> body) {
        requireDriver();
        String tracking = body.get("trackingNumber");
        if (tracking == null || tracking.isBlank()) throw et.guzo.common.ApiException.badRequest("trackingNumber is required");
        return ApiResponse.ok(driverOpsService.scanManifest(SecurityUtil.requireUser().getId(), manifestId, tracking), "Parcel scanned");
    }

    @PostMapping("/manifests/{manifestId}/depart")
    public ApiResponse<TransportManifest> depart(@PathVariable String manifestId, @RequestBody(required = false) Map<String, String> body) {
        requireDriver();
        String seal = body != null ? body.get("sealNumber") : null;
        return ApiResponse.ok(driverOpsService.departManifest(SecurityUtil.requireUser().getId(), manifestId, seal), "Manifest departed");
    }

    @PostMapping("/manifests/{manifestId}/arrive")
    public ApiResponse<TransportManifest> arrive(@PathVariable String manifestId) {
        requireDriver();
        return ApiResponse.ok(driverOpsService.arriveManifest(SecurityUtil.requireUser().getId(), manifestId), "Manifest arrived");
    }

    @PostMapping("/manifests/{manifestId}/unload")
    public ApiResponse<Map<String, Object>> unload(@PathVariable String manifestId, @RequestBody Map<String, String> body) {
        requireDriver();
        String tracking = body.get("trackingNumber");
        if (tracking == null || tracking.isBlank()) throw et.guzo.common.ApiException.badRequest("trackingNumber is required");
        return ApiResponse.ok(driverOpsService.unloadManifest(SecurityUtil.requireUser(), manifestId, tracking), "Parcel unloaded");
    }

    @GetMapping("/earnings")
    public ApiResponse<Map<String, Object>> earnings() {
        requireDriver();
        return ApiResponse.ok(driverOpsService.getEarnings(SecurityUtil.requireUser().getId()), "Driver earnings");
    }

    @GetMapping("/vehicle")
    public ApiResponse<Map<String, Object>> vehicle() {
        requireDriver();
        return ApiResponse.ok(driverOpsService.getMyVehicle(SecurityUtil.requireUser().getId()), "Driver vehicle");
    }

    @GetMapping("/vehicle/logs")
    public ApiResponse<List<Map<String, Object>>> vehicleLogs() {
        requireDriver();
        return ApiResponse.ok(driverOpsService.listVehicleLogs(SecurityUtil.requireUser().getId(), 30), "Vehicle logs");
    }

    @PostMapping("/vehicle/logs")
    public ApiResponse<Map<String, Object>> createVehicleLog(@Valid @RequestBody VehicleLogRequest body) {
        requireDriver();
        return ApiResponse.ok(
            driverOpsService.createVehicleLog(
                SecurityUtil.requireUser().getId(),
                body.type(),
                body.odometerKm(),
                body.amount(),
                body.note()
            ),
            "Vehicle log created"
        );
    }

    @GetMapping("/route")
    public ApiResponse<Map<String, Object>> route() {
        requireDriver();
        return ApiResponse.ok(driverOpsService.optimizedRoute(SecurityUtil.requireUser().getId()), "Optimized route");
    }
}
