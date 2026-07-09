package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.security.SecurityUtil;
import et.guzo.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    public ApiResponse<Map<String, Object>> admin() {
        return ApiResponse.ok(dashboardService.adminSummary());
    }

    @GetMapping("/merchant")
    public ApiResponse<Map<String, Object>> merchant() {
        return ApiResponse.ok(dashboardService.merchantSummary(SecurityUtil.requireUser().getId()));
    }

    @GetMapping("/customer")
    public ApiResponse<Map<String, Object>> customer() {
        return ApiResponse.ok(dashboardService.customerSummary(SecurityUtil.requireUser().getId()));
    }

    @GetMapping("/driver")
    public ApiResponse<Map<String, Object>> driver() {
        return ApiResponse.ok(dashboardService.driverSummary(SecurityUtil.requireUser().getId()));
    }

    @GetMapping("/warehouse")
    public ApiResponse<Map<String, Object>> warehouse() {
        return ApiResponse.ok(dashboardService.warehouseSummary());
    }

    @GetMapping("/finance")
    public ApiResponse<Map<String, Object>> finance() {
        return ApiResponse.ok(dashboardService.financeSummary());
    }

    @GetMapping("/support")
    public ApiResponse<Map<String, Object>> support() {
        return ApiResponse.ok(dashboardService.supportSummary());
    }

    @GetMapping("/branch")
    public ApiResponse<Map<String, Object>> branch(@RequestParam String branchId) {
        return ApiResponse.ok(dashboardService.branchSummary(branchId, SecurityUtil.requireUser()));
    }
}
