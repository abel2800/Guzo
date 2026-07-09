package et.guzo.repository;

import et.guzo.domain.entity.WarehouseInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, String> {
    Optional<WarehouseInventory> findByPackageId(String packageId);

    Page<WarehouseInventory> findByWarehouseIdAndDispatchedAtIsNull(String warehouseId, Pageable pageable);

    Page<WarehouseInventory> findByWarehouseIdAndDispatchedAtIsNotNull(String warehouseId, Pageable pageable);

    Page<WarehouseInventory> findByWarehouseId(String warehouseId, Pageable pageable);

    long countByWarehouseIdAndDispatchedAtIsNull(String warehouseId);

    long countByWarehouseIdAndReceivedAtAfter(String warehouseId, Instant after);

    long countByWarehouseIdAndDispatchedAtAfter(String warehouseId, Instant after);

    long countByDispatchedAtIsNull();

    long countByReceivedAtAfter(Instant after);

    long countByDispatchedAtAfter(Instant after);

    @Query("SELECT COUNT(DISTINCT inv.shelfCode) FROM WarehouseInventory inv WHERE inv.warehouseId = :warehouseId AND inv.dispatchedAt IS NULL AND inv.shelfCode IS NOT NULL")
    long countDistinctShelvesInStock(@Param("warehouseId") String warehouseId);

    @Query("SELECT inv FROM WarehouseInventory inv WHERE inv.warehouseId = :warehouseId AND inv.dispatchedAt IS NULL ORDER BY inv.receivedAt ASC")
    List<WarehouseInventory> findInStock(@Param("warehouseId") String warehouseId);
}
