package et.guzo.web.controller;

import et.guzo.common.ApiException;
import et.guzo.common.ApiResponse;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me() {
        if (!RoleChecker.hasAnyRole(SecurityUtil.requireUser(), "CUSTOMER")) {
            throw ApiException.forbidden("Customer access required");
        }
        return ApiResponse.ok(loyaltyService.getProfile(SecurityUtil.requireUser().getId()));
    }

    @PostMapping("/referral")
    public ApiResponse<Map<String, Object>> applyReferral(@RequestBody Map<String, String> body) {
        if (!RoleChecker.hasAnyRole(SecurityUtil.requireUser(), "CUSTOMER")) {
            throw ApiException.forbidden("Customer access required");
        }
        return ApiResponse.ok(loyaltyService.applyReferral(SecurityUtil.requireUser().getId(), body.get("code")));
    }
}
