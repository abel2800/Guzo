package et.guzo.repository;

import et.guzo.domain.entity.BranchStaff;
import et.guzo.domain.entity.BranchStaffId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchStaffRepository extends JpaRepository<BranchStaff, BranchStaffId> {
    List<BranchStaff> findByUserId(String userId);
    List<BranchStaff> findByBranchId(String branchId);
}
