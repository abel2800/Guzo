package et.guzo.repository;

import et.guzo.domain.entity.Invoice;
import et.guzo.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Optional<Invoice> findByOrderId(String orderId);

    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Invoice> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status IN ('ISSUED', 'OVERDUE')")
    BigDecimal sumOutstanding();

    long countByStatusIn(Iterable<InvoiceStatus> statuses);
}
