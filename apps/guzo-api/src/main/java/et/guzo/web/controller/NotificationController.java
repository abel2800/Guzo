package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.security.SecurityUtil;
import et.guzo.service.NotificationService;
import et.guzo.web.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationDto>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) Boolean unread
    ) {
        var user = SecurityUtil.requireUser();
        Map<String, Object> result = notificationService.listPaginated(user.getId(), page, limit, Boolean.TRUE.equals(unread));
        @SuppressWarnings("unchecked")
        List<NotificationDto> items = (List<NotificationDto>) result.get("items");
        PaginationMeta meta = (PaginationMeta) result.get("meta");
        return ApiResponse.ok(items, "Notifications loaded", meta);
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(@PathVariable String id) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(notificationService.markRead(user.getId(), id));
    }

    @PostMapping("/read-all")
    public ApiResponse<Map<String, Integer>> markAllRead() {
        var user = SecurityUtil.requireUser();
        int count = notificationService.markAllRead(user.getId());
        return ApiResponse.ok(Map.of("marked", count));
    }
}
