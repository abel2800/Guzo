package et.guzo.repository;

import et.guzo.domain.entity.Order;
import et.guzo.domain.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {
    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByCustomerId(String customerId, Pageable pageable);

    Page<Order> findByMerchantId(String merchantId, Pageable pageable);

    Page<Order> findByIdIn(List<String> ids, Pageable pageable);

    @Query(value = """
        SELECT o.* FROM orders o
        JOIN deliveries d ON d."orderId" = o.id
        WHERE d."driverId" = :driverId
        ORDER BY o."createdAt" DESC
        """, nativeQuery = true)
    Page<Order> findByDriverId(@Param("driverId") String driverId, Pageable pageable);

    long countByStatus(OrderStatus status);

    long countByStatusIn(List<OrderStatus> statuses);

    long countByMerchantId(String merchantId);

    long countByMerchantIdAndStatus(String merchantId, OrderStatus status);

    long countByCustomerId(String customerId);

    long countByCustomerIdAndStatus(String customerId, OrderStatus status);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.merchantId = :merchantId GROUP BY o.status")
    List<Object[]> countGroupByStatusForMerchant(@Param("merchantId") String merchantId);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.customerId = :customerId GROUP BY o.status")
    List<Object[]> countGroupByStatusForCustomer(@Param("customerId") String customerId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN ('PENDING_PAYMENT', 'CANCELLED') AND o.merchantId = :merchantId")
    java.math.BigDecimal sumRevenueByMerchant(@Param("merchantId") String merchantId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.merchantId = :merchantId AND o.status IN :statuses")
    long countByMerchantIdAndStatusIn(@Param("merchantId") String merchantId, @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.customerId = :customerId AND o.status IN :statuses")
    long countByCustomerIdAndStatusIn(@Param("customerId") String customerId, @Param("statuses") List<OrderStatus> statuses);

    @Query("""
        SELECT o FROM Order o
        WHERE o.customerId <> :customerId
        AND (
          (:guzoId IS NOT NULL AND :guzoId <> '' AND o.receiverGuzoId = :guzoId)
          OR (:phone IS NOT NULL AND :phone <> '' AND o.receiverPhone = :phone)
        )
        """)
    Page<Order> findIncomingForReceiver(
        @Param("customerId") String customerId,
        @Param("guzoId") String guzoId,
        @Param("phone") String phone,
        Pageable pageable
    );

    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.customerId <> :customerId
        AND (
          (:guzoId IS NOT NULL AND :guzoId <> '' AND o.receiverGuzoId = :guzoId)
          OR (:phone IS NOT NULL AND :phone <> '' AND o.receiverPhone = :phone)
        )
        """)
    long countIncomingForReceiver(
        @Param("customerId") String customerId,
        @Param("guzoId") String guzoId,
        @Param("phone") String phone
    );

    Page<Order> findByMerchantIdAndStatus(String merchantId, OrderStatus status, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    Page<Order> findByCustomerIdAndStatus(String customerId, OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.customerId = :customerId AND (LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchByCustomer(@Param("customerId") String customerId, @Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.receiverPhone) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Order> searchAll(@Param("search") String search, Pageable pageable);

    long countByDestinationBranchIdAndStatus(String destinationBranchId, OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.originBranchId = :branchId AND o.status IN :statuses")
    long countByOriginBranchIdAndStatusIn(@Param("branchId") String branchId, @Param("statuses") List<OrderStatus> statuses);

    @Query(value = """
        SELECT COUNT(*) FROM orders o
        JOIN deliveries d ON d."orderId" = o.id
        WHERE d."driverId" = :driverId AND o.status IN ('ASSIGNED', 'PICKED_UP')
        AND o."updatedAt" >= :since
        """, nativeQuery = true)
    long countDriverPickupsSince(@Param("driverId") String driverId, @Param("since") java.time.Instant since);

    long countByCreatedAtAfter(Instant since);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    List<Order> findByStatusInOrderByUpdatedAtDesc(List<OrderStatus> statuses, Pageable pageable);
}
