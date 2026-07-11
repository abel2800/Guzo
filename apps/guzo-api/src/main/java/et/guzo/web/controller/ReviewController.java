package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Review;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.ReviewService;
import et.guzo.web.dto.ReviewCreateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<Review>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Map<String, Object> result = reviewService.list(page, limit);
        @SuppressWarnings("unchecked")
        List<Review> items = (List<Review>) result.get("items");
        return ApiResponse.ok(items, "Reviews loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/pending")
    public ApiResponse<List<Map<String, Object>>> pending() {
        return ApiResponse.ok(reviewService.pendingForCustomer(SecurityUtil.requireUser().getId()), "Orders awaiting rating");
    }

    @PostMapping("/orders/{orderId}")
    public ApiResponse<Review> createForOrder(
        @PathVariable String orderId,
        @Valid @RequestBody ReviewCreateRequest body
    ) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(
            reviewService.createForOrder(user.getId(), orderId, body.rating(), body.comment()),
            "Review submitted"
        );
    }
}
