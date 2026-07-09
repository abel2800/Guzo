package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.enums.InvoiceStatus;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search
    ) {
        var user = SecurityUtil.requireUser();
        Map<String, Object> result = invoiceService.list(user.getId(), RoleChecker.isAdmin(user), page, limit, status, search);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Invoices loaded", (PaginationMeta) result.get("meta"));
    }

    @PatchMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(invoiceService.updateStatus(id, InvoiceStatus.valueOf(body.get("status"))), "Invoice updated");
    }
}
