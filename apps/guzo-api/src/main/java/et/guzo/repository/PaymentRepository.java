package et.guzo.repository;

import et.guzo.domain.entity.Payment;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByOrderId(String orderId);
    Optional<Payment> findByReference(String reference);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE LOWER(p.reference) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Payment> search(@Param("search") String search, Pageable pageable);

    long countByStatus(PaymentStatus status);

    long countByStatusIn(Iterable<PaymentStatus> statuses);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status IN ('PAID', 'PARTIALLY_REFUNDED')")
    BigDecimal sumGrossRevenue();

    @Query("SELECT COALESCE(SUM(p.refundedAmount), 0) FROM Payment p")
    BigDecimal sumRefunded();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID' AND p.paidAt >= :since")
    BigDecimal sumPaidRevenueSince(@Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID' AND p.paidAt >= :start AND p.paidAt < :end")
    BigDecimal sumPaidRevenueBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT p.status, COUNT(p), COALESCE(SUM(p.amount), 0), COALESCE(SUM(p.refundedAmount), 0) FROM Payment p GROUP BY p.status")
    List<Object[]> groupByStatus();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'PAID' AND p.orderId IN (SELECT o.id FROM Order o WHERE o.status NOT IN ('DELIVERED', 'CANCELLED'))")
    long countPaidBeforeDelivery();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'DELIVERED' AND NOT EXISTS (SELECT p FROM Payment p WHERE p.orderId = o.id AND p.status IN ('PAID', 'PARTIALLY_REFUNDED'))")
    long countDeliveredUnpaid();
}
