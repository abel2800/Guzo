package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.security.SecurityUtil;
import et.guzo.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String priority,
        @RequestParam(required = false) String search
    ) {
        Map<String, Object> result = supportService.list(SecurityUtil.requireUser(), page, limit, status, priority, search);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Tickets loaded", (PaginationMeta) result.get("meta"));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(supportService.create(body, SecurityUtil.requireUser()), "Ticket created");
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String id) {
        return ApiResponse.ok(supportService.get(id, SecurityUtil.requireUser()));
    }

    @PostMapping("/{id}/messages")
    public ApiResponse<Map<String, Object>> addMessage(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(supportService.addMessage(id, body, SecurityUtil.requireUser()), "Message added");
    }

    @PatchMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(supportService.update(id, body, SecurityUtil.requireUser()), "Ticket updated");
    }
}
