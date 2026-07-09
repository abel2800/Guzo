package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.BranchStaff;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.BranchStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/branch-staff")
@RequiredArgsConstructor
public class BranchStaffController {

    private final BranchStaffService branchStaffService;

    @PostMapping
    public ApiResponse<BranchStaff> assign(@RequestBody Map<String, String> body) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(branchStaffService.assign(body.get("userId"), body.get("branchId")), "Staff assigned");
    }

    @GetMapping("/branch/{branchId}")
    public ApiResponse<List<BranchStaff>> list(@PathVariable String branchId) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(branchStaffService.listByBranch(branchId));
    }

    @GetMapping("/me")
    public ApiResponse<List<Map<String, Object>>> me() {
        return ApiResponse.ok(branchStaffService.myBranches(SecurityUtil.requireUser().getId()));
    }
}
