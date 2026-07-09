package et.guzo.repository;

import et.guzo.domain.entity.Driver;
import et.guzo.domain.enums.DriverApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, String> {
    Optional<Driver> findByUserId(String userId);

    long countByApprovalStatus(DriverApprovalStatus status);

    Page<Driver> findByApprovalStatus(DriverApprovalStatus status, Pageable pageable);

    @Query(value = """
        SELECT d.* FROM drivers d
        JOIN users u ON u.id = d."userId"
        WHERE (:status IS NULL OR d."approvalStatus" = :status)
        AND (
          :search IS NULL OR :search = '' OR
          LOWER(d."driverCode") LIKE LOWER(CONCAT('%', :search, '%')) OR
          LOWER(u."firstName") LIKE LOWER(CONCAT('%', :search, '%')) OR
          LOWER(u."lastName") LIKE LOWER(CONCAT('%', :search, '%'))
        )
        ORDER BY d."createdAt" DESC
        """, nativeQuery = true, countQuery = """
        SELECT COUNT(*) FROM drivers d
        JOIN users u ON u.id = d."userId"
        WHERE (:status IS NULL OR d."approvalStatus" = :status)
        AND (
          :search IS NULL OR :search = '' OR
          LOWER(d."driverCode") LIKE LOWER(CONCAT('%', :search, '%')) OR
          LOWER(u."firstName") LIKE LOWER(CONCAT('%', :search, '%')) OR
          LOWER(u."lastName") LIKE LOWER(CONCAT('%', :search, '%'))
        )
        """)
    Page<Driver> searchDrivers(@Param("search") String search, @Param("status") String status, Pageable pageable);
}
