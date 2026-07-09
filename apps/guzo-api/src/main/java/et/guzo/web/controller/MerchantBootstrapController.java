package et.guzo.web.controller;

import et.guzo.common.ApiException;
import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.MerchantWebhook;
import et.guzo.repository.MerchantRepository;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.MerchantPlatformService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/merchant-platform")
@RequiredArgsConstructor
public class MerchantBootstrapController {

    private final MerchantPlatformService merchantPlatformService;
    private final MerchantRepository merchantRepository;

    private String requireMerchantId() {
        var user = SecurityUtil.requireUser();
        if (!RoleChecker.hasAnyRole(user, "MERCHANT")) {
            throw ApiException.forbidden("Merchant access required");
        }
        return merchantRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a merchant"))
            .getId();
    }

    @GetMapping("/keys")
    public ApiResponse<List<Map<String, Object>>> listKeys() {
        return ApiResponse.ok(merchantPlatformService.listApiKeys(requireMerchantId()), "API keys loaded");
    }

    @PostMapping("/keys")
    public ApiResponse<Map<String, String>> createKey(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(
            merchantPlatformService.createApiKey(requireMerchantId(), body.getOrDefault("label", "default")),
            "API key created"
        );
    }

    @DeleteMapping("/keys/{id}")
    public ApiResponse<Map<String, Object>> revokeKey(@PathVariable String id) {
        return ApiResponse.ok(merchantPlatformService.revokeApiKey(requireMerchantId(), id), "API key revoked");
    }

    @GetMapping("/webhooks")
    public ApiResponse<List<Map<String, Object>>> listWebhooks() {
        return ApiResponse.ok(merchantPlatformService.listWebhooks(requireMerchantId()), "Webhooks loaded");
    }

    @PostMapping("/webhooks")
    public ApiResponse<MerchantWebhook> registerWebhook(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(
            merchantPlatformService.registerWebhook(requireMerchantId(), body.get("url"), body.get("secret")),
            "Webhook registered"
        );
    }

    @PostMapping("/webhooks/test")
    public ApiResponse<Map<String, Object>> testWebhook(@RequestBody(required = false) Map<String, Object> body) {
        String merchantId = requireMerchantId();
        String eventType = body != null && body.get("eventType") != null
            ? String.valueOf(body.get("eventType")) : "parcel.status_changed";
        String payload = body != null && body.get("payload") != null
            ? body.get("payload").toString() : "{\"test\":true}";
        merchantPlatformService.dispatchEvent(merchantId, eventType, payload);
        return ApiResponse.ok(Map.of("queued", true), "Test event queued");
    }

    @GetMapping("/customers")
    public ApiResponse<List<Map<String, Object>>> listCustomers() {
        return ApiResponse.ok(merchantPlatformService.listCustomers(requireMerchantId()), "Merchant customers loaded");
    }
}
