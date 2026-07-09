package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.service.WarehouseOpsService;
import et.guzo.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final WarehouseOpsService warehouseOpsService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(defaultValue = "100") int limit) {
        return ApiResponse.ok(warehouseService.list(limit));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<Map<String, Object>> stats(@PathVariable String id) {
        return ApiResponse.ok(warehouseOpsService.stats(id));
    }

    @GetMapping("/{id}/inventory")
    public ApiResponse<List<Map<String, Object>>> inventory(
        @PathVariable String id,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(defaultValue = "in-stock") String state
    ) {
        Map<String, Object> result = warehouseOpsService.listInventory(id, page, limit, state);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Inventory loaded", (PaginationMeta) result.get("meta"));
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<Map<String, Object>> receive(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(warehouseOpsService.receive(id, body), "Parcel received");
    }

    @PostMapping("/{id}/sort")
    public ApiResponse<Map<String, Object>> sort(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(warehouseOpsService.sort(id, body), "Parcel sorted");
    }

    @PostMapping("/{id}/dispatch")
    public ApiResponse<Map<String, Object>> dispatch(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(warehouseOpsService.dispatch(id, body), "Parcel dispatched");
    }

    @GetMapping("/{id}/inventory/by-city")
    public ApiResponse<List<Map<String, Object>>> inventoryByCity(@PathVariable String id) {
        return ApiResponse.ok(warehouseOpsService.inventoryByCity(id));
    }

    @GetMapping("/{id}/aging")
    public ApiResponse<Map<String, Object>> aging(@PathVariable String id) {
        return ApiResponse.ok(warehouseOpsService.agingReport(id));
    }

    @PostMapping("/{id}/transfer")
    public ApiResponse<Map<String, Object>> transfer(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(warehouseOpsService.transfer(id, body), "Parcel transferred");
    }
}
