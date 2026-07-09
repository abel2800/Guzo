package et.guzo.repository;

import et.guzo.domain.entity.Package;
import et.guzo.domain.enums.PackageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PackageRepository extends JpaRepository<Package, String> {
    Optional<Package> findByTrackingNumber(String trackingNumber);
    Optional<Package> findByPickupPin(String pickupPin);
    List<Package> findByOrderId(String orderId);

    @Query("SELECT p.status, COUNT(p) FROM Package p WHERE p.warehouseId = :warehouseId GROUP BY p.status")
    List<Object[]> countGroupByStatusForWarehouse(@Param("warehouseId") String warehouseId);

    @Query("SELECT p.status, COUNT(p) FROM Package p GROUP BY p.status")
    List<Object[]> countGroupByStatus();

    List<Package> findByStatusOrderByUpdatedAtDesc(PackageStatus status, Pageable pageable);

    List<Package> findByStatusInOrderByUpdatedAtDesc(List<PackageStatus> statuses, Pageable pageable);
}
