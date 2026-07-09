package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.MerchantWebhook;
import et.guzo.security.MerchantApiKeyFilter;
import et.guzo.service.MerchantPlatformService;
import et.guzo.service.OrderService;
import et.guzo.web.dto.OrderCreateRequest;
import et.guzo.web.dto.OrderDetailDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/merchant-api")
@RequiredArgsConstructor
public class MerchantPlatformController {

    private final MerchantPlatformService merchantPlatformService;
    private final OrderService orderService;

    @PostMapping("/orders")
    public ApiResponse<OrderDetailDto> createOrder(@Valid @RequestBody OrderCreateRequest body, HttpServletRequest req) {
        String merchantId = (String) req.getAttribute(MerchantApiKeyFilter.MERCHANT_ID_ATTR);
        return ApiResponse.ok(orderService.createForMerchant(body, merchantId), "Merchant order created");
    }

    @PostMapping("/keys")
    public ApiResponse<Map<String, String>> createKey(@RequestBody Map<String, String> body, HttpServletRequest req) {
        String merchantId = (String) req.getAttribute(MerchantApiKeyFilter.MERCHANT_ID_ATTR);
        return ApiResponse.ok(merchantPlatformService.createApiKey(merchantId, body.getOrDefault("label", "default")));
    }

    @PostMapping("/webhooks")
    public ApiResponse<MerchantWebhook> registerWebhook(@RequestBody Map<String, String> body, HttpServletRequest req) {
        String merchantId = (String) req.getAttribute(MerchantApiKeyFilter.MERCHANT_ID_ATTR);
        return ApiResponse.ok(merchantPlatformService.registerWebhook(merchantId, body.get("url"), body.get("secret")));
    }

    @PostMapping("/events/test")
    public ApiResponse<Map<String, Object>> testEvent(@RequestBody Map<String, String> body, HttpServletRequest req) {
        String merchantId = (String) req.getAttribute(MerchantApiKeyFilter.MERCHANT_ID_ATTR);
        merchantPlatformService.dispatchEvent(merchantId, body.getOrDefault("eventType", "parcel.status_changed"), body.getOrDefault("payload", "{}"));
        return ApiResponse.ok(Map.of("queued", true), "Event queued");
    }
}
