package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.security.SecurityUtil;
import et.guzo.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ApiResponse<Map<String, Object>> summary() {
        return ApiResponse.ok(walletService.summary(SecurityUtil.requireUser().getId()));
    }

    @GetMapping("/transactions")
    public ApiResponse<Map<String, Object>> transactions(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return ApiResponse.ok(walletService.transactions(SecurityUtil.requireUser().getId(), page, limit));
    }

    @PostMapping("/top-up")
    public ApiResponse<Map<String, Object>> topUp(@RequestBody Map<String, Object> body) {
        BigDecimal amount = body.get("amount") != null ? new BigDecimal(body.get("amount").toString()) : BigDecimal.ZERO;
        String description = body.get("description") != null ? body.get("description").toString() : null;
        return ApiResponse.ok(walletService.topUp(SecurityUtil.requireUser().getId(), amount, description), "Top-up successful");
    }
}
