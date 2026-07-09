package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.AdminService;
import et.guzo.service.OrderService;
import et.guzo.service.PaymentService;
import et.guzo.web.dto.OrderDetailDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search
    ) {
        Map<String, Object> result = paymentService.list(page, limit, status, search);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Payments loaded", (PaginationMeta) result.get("meta"));
    }

    @PostMapping("/confirm/{reference}")
    public ApiResponse<OrderDetailDto> confirm(@PathVariable String reference) {
        return ApiResponse.ok(orderService.confirmPayment(reference), "Payment confirmed");
    }

    @PostMapping("/{id}/refund")
    public ApiResponse<Map<String, Object>> refund(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        BigDecimal amount = body != null && body.get("amount") != null ? new BigDecimal(body.get("amount").toString()) : null;
        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : null;
        return ApiResponse.ok(paymentService.refund(id, new PaymentService.RefundRequest(amount, reason)), "Refund processed");
    }
}
