package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.enums.UserStatus;
import et.guzo.security.SecurityUtil;
import et.guzo.service.UserAdminService;
import et.guzo.web.dto.AdminUserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ApiResponse<List<AdminUserDto>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status
    ) {
        Map<String, Object> result = userAdminService.list(SecurityUtil.requireUser(), page, limit, search, status);
        @SuppressWarnings("unchecked")
        List<AdminUserDto> items = (List<AdminUserDto>) result.get("items");
        PaginationMeta meta = (PaginationMeta) result.get("meta");
        return ApiResponse.ok(items, "Users loaded", meta);
    }

    @PatchMapping("/{id}")
    public ApiResponse<AdminUserDto> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        UserStatus status = UserStatus.valueOf(body.get("status"));
        return ApiResponse.ok(userAdminService.updateStatus(SecurityUtil.requireUser(), id, status), "User updated");
    }

    @PutMapping("/{id}/roles")
    public ApiResponse<AdminUserDto> assignRoles(@PathVariable String id, @RequestBody Map<String, List<String>> body) {
        return ApiResponse.ok(userAdminService.assignRoles(SecurityUtil.requireUser(), id, body.get("roles")), "Roles updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        userAdminService.delete(SecurityUtil.requireUser(), id);
        return ApiResponse.ok(null, "User deleted");
    }
}
