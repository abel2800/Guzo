package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.InsuranceClaim;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.InsuranceClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/insurance-claims")
@RequiredArgsConstructor
public class InsuranceClaimController {

    private final InsuranceClaimService insuranceClaimService;

    @GetMapping
    public ApiResponse<List<InsuranceClaim>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        var user = SecurityUtil.requireUser();
        boolean customerOnly = RoleChecker.hasAnyRole(user, "CUSTOMER") && !RoleChecker.isAdmin(user);
        Map<String, Object> result = insuranceClaimService.list(page, limit, user.getId(), customerOnly);
        @SuppressWarnings("unchecked")
        List<InsuranceClaim> items = (List<InsuranceClaim>) result.get("items");
        return ApiResponse.ok(items, "Insurance claims", (PaginationMeta) result.get("meta"));
    }
}
