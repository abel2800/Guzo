package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/merchants")
    public ApiResponse<List<?>> listMerchants(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listMerchants(page, limit);
        return ApiResponse.ok((List<?>) result.get("items"), "Merchants loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/customers")
    public ApiResponse<List<Map<String, Object>>> listCustomers(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listCustomers(page, limit);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Customers loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/pricing")
    public ApiResponse<List<?>> listPricing(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listPricing(page, limit);
        return ApiResponse.ok((List<?>) result.get("items"), "Pricing rules loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/coupons")
    public ApiResponse<List<?>> listCoupons(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listCoupons(page, limit);
        return ApiResponse.ok((List<?>) result.get("items"), "Coupons loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/vehicles")
    public ApiResponse<List<?>> listVehicles(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listVehicles(page, limit);
        return ApiResponse.ok((List<?>) result.get("items"), "Vehicles loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/permissions")
    public ApiResponse<List<?>> listPermissions(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = catalogService.listPermissions(page, limit);
        return ApiResponse.ok((List<?>) result.get("items"), "Permissions loaded", (PaginationMeta) result.get("meta"));
    }
}
