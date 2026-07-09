package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.GpsLocation;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.GpsTrackingService;
import et.guzo.service.TrackingService;
import et.guzo.web.dto.DriverLocationPayload;
import et.guzo.web.dto.RecordLocationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;
    private final GpsTrackingService gpsTrackingService;

    @GetMapping("/orders/{orderId}")
    public ApiResponse<List<?>> timeline(@PathVariable String orderId) {
        return ApiResponse.ok(trackingService.listForOrder(orderId));
    }

    @PostMapping("/location")
    public ApiResponse<DriverLocationPayload> recordLocation(@Valid @RequestBody RecordLocationRequest body) {
        var user = SecurityUtil.requireUser();
        if (!RoleChecker.hasAnyRole(user, "DRIVER")) {
            throw et.guzo.common.ApiException.forbidden("Only drivers can record location");
        }
        return ApiResponse.ok(gpsTrackingService.recordLocation(user.getId(), body));
    }

    @GetMapping("/location/history")
    public ApiResponse<List<GpsLocation>> locationHistory() {
        return ApiResponse.ok(gpsTrackingService.locationHistory(SecurityUtil.requireUser().getId()));
    }
}
