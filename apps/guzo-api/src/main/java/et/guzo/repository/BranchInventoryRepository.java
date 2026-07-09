package et.guzo.repository;

import et.guzo.domain.entity.BranchInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BranchInventoryRepository extends JpaRepository<BranchInventory, String> {
    Optional<BranchInventory> findByPackageId(String packageId);

    Page<BranchInventory> findByBranchIdAndPickedUpAtIsNull(String branchId, Pageable pageable);

    Page<BranchInventory> findByBranchId(String branchId, Pageable pageable);

    List<BranchInventory> findByBranchIdAndShelfCodeIgnoreCaseAndPickedUpAtIsNull(String branchId, String shelfCode);

    long countByBranchIdAndPickedUpAtIsNull(String branchId);

    long countByBranchIdAndReceivedAtAfter(String branchId, Instant after);

    long countByBranchIdAndPickedUpAtAfter(String branchId, Instant after);
}
