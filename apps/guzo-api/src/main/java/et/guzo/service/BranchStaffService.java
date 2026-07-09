package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Branch;
import et.guzo.domain.entity.BranchStaff;
import et.guzo.repository.BranchRepository;
import et.guzo.repository.BranchStaffRepository;
import et.guzo.domain.entity.Role;
import et.guzo.domain.entity.UserRole;
import et.guzo.domain.entity.UserRoleId;
import et.guzo.repository.RoleRepository;
import et.guzo.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BranchStaffService {

    private final BranchStaffRepository branchStaffRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public BranchStaff assign(String userId, String branchId) {
        Role role = roleRepository.findByName("BRANCH_STAFF")
            .orElseThrow(() -> ApiException.badRequest("BRANCH_STAFF role is not configured"));
        UserRoleId roleKey = new UserRoleId(userId, role.getId());
        if (!userRoleRepository.existsById(roleKey)) {
            UserRole ur = new UserRole();
            ur.setUserId(userId);
            ur.setRoleId(role.getId());
            ur.setAssignedAt(Instant.now());
            userRoleRepository.save(ur);
        }

        BranchStaff staff = new BranchStaff();
        staff.setUserId(userId);
        staff.setBranchId(branchId);
        staff.setAssignedAt(Instant.now());
        return branchStaffRepository.save(staff);
    }

    @Transactional(readOnly = true)
    public List<BranchStaff> listByBranch(String branchId) {
        return branchStaffRepository.findByBranchId(branchId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myBranches(String userId) {
        return branchStaffRepository.findByUserId(userId).stream().map(staff -> {
            Branch branch = branchRepository.findById(staff.getBranchId()).orElse(null);
            return Map.<String, Object>of(
                "branchId", staff.getBranchId(),
                "assignedAt", staff.getAssignedAt(),
                "branch", branch == null ? null : Map.of(
                    "id", branch.getId(),
                    "code", branch.getCode(),
                    "name", branch.getName(),
                    "city", branch.getCity(),
                    "line1", branch.getLine1(),
                    "phone", branch.getPhone()
                )
            );
        }).toList();
    }
}
