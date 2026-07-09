package et.guzo.repository;

import et.guzo.domain.entity.Delivery;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, String> {
    Optional<Delivery> findByOrderId(String orderId);

    @Query("SELECT d.orderId FROM Delivery d WHERE d.driverId = :driverId")
    List<String> findOrderIdsByDriverId(@Param("driverId") String driverId);

    @Query(value = """
        SELECT o.id FROM orders o
        LEFT JOIN deliveries d ON d."orderId" = o.id
        WHERE o.status = 'CONFIRMED' AND d.id IS NULL
        ORDER BY o."createdAt" DESC
        """, nativeQuery = true)
    List<String> findAvailableOrderIds();

    long countByDriverIdAndDeliveredAtIsNull(String driverId);

    long countByDriverIdAndDeliveredAtIsNotNull(String driverId);

    long countByDeliveredAtIsNullAndDriverIdIsNotNull();

    @Query(value = """
        SELECT COUNT(*) FROM deliveries d
        WHERE d."driverId" = :driverId AND d."deliveredAt" >= :since
        """, nativeQuery = true)
    long countByDriverIdAndDeliveredAtAfter(@Param("driverId") String driverId, @Param("since") Instant since);

    List<Delivery> findByDriverIdAndDeliveredAtIsNull(String driverId);

    long countByDeliveredAtAfter(Instant since);

    long countByFailedAtAfter(Instant since);

    List<Delivery> findByFailedAtIsNotNullOrderByFailedAtDesc(Pageable pageable);
}
