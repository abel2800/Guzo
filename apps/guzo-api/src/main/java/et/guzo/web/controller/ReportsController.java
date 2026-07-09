package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.service.ReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping("/orders")
    public ApiResponse<Map<String, Object>> orders(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        return ApiResponse.ok(reportsService.ordersReport(from, to));
    }

    @GetMapping("/deliveries")
    public ApiResponse<Map<String, Object>> deliveries(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        return ApiResponse.ok(reportsService.deliveriesReport(from, to));
    }
}
