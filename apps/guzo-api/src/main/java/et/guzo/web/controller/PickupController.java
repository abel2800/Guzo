package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.Package;
import et.guzo.service.OrderService;
import et.guzo.service.PickupCodeService;
import et.guzo.web.dto.PickupVerifyRequest;
import et.guzo.web.dto.PickupVerifyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pickup")
@RequiredArgsConstructor
public class PickupController {

    private final PickupCodeService pickupCodeService;
    private final OrderService orderService;

    @PostMapping("/verify")
    public ApiResponse<PickupVerifyResponse> verify(@Valid @RequestBody PickupVerifyRequest body) {
        Package pkg = pickupCodeService.verifyPickup(body.reference(), body.pin());
        orderService.completePickup(pkg.getId());
        return ApiResponse.ok(new PickupVerifyResponse(
            pkg.getId(),
            pkg.getTrackingNumber(),
            pkg.getQrCode(),
            true
        ), "Pickup verified");
    }
}
