package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/orders-over-time")
    public ApiResponse<List<Map<String, Object>>> ordersOverTime(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.ordersOverTime(days));
    }

    @GetMapping("/revenue-by-type")
    public ApiResponse<List<Map<String, Object>>> revenueByType() {
        return ApiResponse.ok(analyticsService.revenueByType());
    }

    @GetMapping("/top-drivers")
    public ApiResponse<List<Map<String, Object>>> topDrivers(@RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(analyticsService.topDrivers(limit));
    }

    @GetMapping("/operations-metrics")
    public ApiResponse<Map<String, Object>> operationsMetrics(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.operationsMetrics(days));
    }

    @GetMapping("/satisfaction")
    public ApiResponse<Map<String, Object>> satisfaction(@RequestParam(defaultValue = "90") int days) {
        return ApiResponse.ok(analyticsService.satisfactionSummary(days));
    }
}
