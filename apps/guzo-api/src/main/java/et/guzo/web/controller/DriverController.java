package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Driver;
import et.guzo.repository.DriverRepository;
import et.guzo.repository.UserRepository;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final AdminService adminService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String approvalStatus
    ) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1));
        Page<Driver> result = driverRepository.searchDrivers(
            search != null ? search : "",
            approvalStatus,
            pageable
        );
        List<Map<String, Object>> items = result.getContent().stream().map(adminService::toDriverDto).toList();
        return ApiResponse.ok(items, "Drivers loaded", PaginationMeta.of(page, limit, result.getTotalElements()));
    }
}
