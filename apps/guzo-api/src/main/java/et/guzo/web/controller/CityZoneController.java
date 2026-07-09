package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.CityPricingZone;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.CityZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import et.guzo.common.PaginationMeta;

@RestController
@RequestMapping("/city-zones")
@RequiredArgsConstructor
public class CityZoneController {

    private final CityZoneService cityZoneService;

    @GetMapping
    public ApiResponse<List<CityPricingZone>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String search
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = cityZoneService.list(page, limit, search);
        @SuppressWarnings("unchecked")
        List<CityPricingZone> items = (List<CityPricingZone>) result.get("items");
        return ApiResponse.ok(items, "City zones loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/{id}")
    public ApiResponse<CityPricingZone> get(@PathVariable String id) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(cityZoneService.getById(id), "City zone loaded");
    }

    @PostMapping
    public ApiResponse<CityPricingZone> create(@RequestBody Map<String, Object> body) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(cityZoneService.create(body), "City zone created");
    }

    @PatchMapping("/{id}")
    public ApiResponse<CityPricingZone> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(cityZoneService.update(id, body), "City zone updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> remove(@PathVariable String id) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        cityZoneService.remove(id);
        return ApiResponse.ok(null, "City zone deleted");
    }
}
