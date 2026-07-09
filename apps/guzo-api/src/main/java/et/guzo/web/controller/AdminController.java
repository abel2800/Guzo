package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> summary() {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(adminService.summary(), "Admin summary");
    }

    @GetMapping("/audit-logs")
    public ApiResponse<List<Map<String, Object>>> auditLogs(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = adminService.auditLogs(page, limit);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Audit logs", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/activity-logs")
    public ApiResponse<List<Map<String, Object>>> activityLogs(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = adminService.activityLogs(page, limit);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Activity logs", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/exceptions")
    public ApiResponse<Map<String, Object>> exceptions(@RequestParam(defaultValue = "20") int limit) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(adminService.exceptions(limit), "Exception center");
    }

    @GetMapping("/payments/reconciliation")
    public ApiResponse<Map<String, Object>> paymentReconciliation() {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(adminService.paymentReconciliation(), "Payment reconciliation");
    }

    @PostMapping("/drivers/{id}/approve")
    public ApiResponse<Map<String, Object>> approve(@PathVariable String id) {
        return ApiResponse.ok(adminService.approveDriver(id, SecurityUtil.requireUser()), "Driver approved");
    }

    @PostMapping("/drivers/{id}/reject")
    public ApiResponse<Map<String, Object>> reject(@PathVariable String id) {
        return ApiResponse.ok(adminService.rejectDriver(id, SecurityUtil.requireUser()), "Driver rejected");
    }
}
