package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.service.MarketingService;
import et.guzo.web.dto.MarketingContactRequest;
import et.guzo.web.dto.MarketingNewsletterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/marketing")
@RequiredArgsConstructor
public class MarketingController {

    private final MarketingService marketingService;

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        return ApiResponse.ok(marketingService.publicStats(), "Marketing stats");
    }

    @PostMapping("/contact")
    public ApiResponse<Map<String, String>> contact(@Valid @RequestBody MarketingContactRequest body) {
        marketingService.submitContact(body);
        return ApiResponse.ok(Map.of("received", "true"), "Message received");
    }

    @PostMapping("/newsletter")
    public ApiResponse<Map<String, String>> newsletter(@Valid @RequestBody MarketingNewsletterRequest body) {
        marketingService.subscribeNewsletter(body);
        return ApiResponse.ok(Map.of("subscribed", "true"), "Subscribed");
    }
}
