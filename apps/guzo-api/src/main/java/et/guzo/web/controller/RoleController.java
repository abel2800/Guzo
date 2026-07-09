package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.repository.RoleRepository;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.web.dto.RoleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    public ApiResponse<List<RoleDto>> list() {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        List<RoleDto> items = roleRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
            .map(RoleDto::from)
            .toList();
        return ApiResponse.ok(items);
    }
}
