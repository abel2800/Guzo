package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Role;
import et.guzo.domain.entity.User;
import et.guzo.domain.entity.UserRole;
import et.guzo.domain.enums.UserStatus;
import et.guzo.repository.RoleRepository;
import et.guzo.repository.UserRepository;
import et.guzo.repository.UserRoleRepository;
import et.guzo.security.RoleChecker;
import et.guzo.security.AuthUser;
import et.guzo.web.dto.AdminUserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(AuthUser actor, int page, int limit, String search, String status) {
        RoleChecker.requireAdmin(actor);
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result;
        if (search != null && !search.isBlank()) {
            result = userRepository.searchUsers(search, pageable);
        } else if (status != null && !status.isBlank()) {
            result = userRepository.findByStatus(UserStatus.valueOf(status), pageable);
        } else {
            result = userRepository.findAll(pageable);
        }
        List<AdminUserDto> items = result.getContent().stream()
            .map(u -> AdminUserDto.of(u, roleRepository.findRoleNamesByUserId(u.getId())))
            .toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional
    public AdminUserDto updateStatus(AuthUser actor, String userId, UserStatus status) {
        RoleChecker.requireAdmin(actor);
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return AdminUserDto.of(user, roleRepository.findRoleNamesByUserId(userId));
    }

    @Transactional
    public AdminUserDto assignRoles(AuthUser actor, String userId, List<String> roleNames) {
        RoleChecker.requireAdmin(actor);
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        Instant now = Instant.now();
        userRoleRepository.deleteByUserId(userId);
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> ApiException.badRequest("Unknown role: " + roleName));
            UserRole ur = new UserRole();
            ur.setUserId(userId);
            ur.setRoleId(role.getId());
            ur.setAssignedAt(now);
            userRoleRepository.save(ur);
        }
        return AdminUserDto.of(user, roleRepository.findRoleNamesByUserId(userId));
    }

    @Transactional
    public void delete(AuthUser actor, String userId) {
        RoleChecker.requireAdmin(actor);
        if (actor.getId().equals(userId)) {
            throw ApiException.badRequest("Cannot delete your own account");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setStatus(UserStatus.DELETED);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }
}
