package et.guzo.domain.entity;

import et.guzo.domain.enums.InvoiceStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    private String id;

    @Column(name = "invoiceNumber", unique = true, nullable = false)
    private String invoiceNumber;

    @Column(name = "orderId", unique = true, nullable = false)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"InvoiceStatus\"")
    private InvoiceStatus status = InvoiceStatus.ISSUED;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(nullable = false)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "issuedAt", nullable = false)
    private Instant issuedAt;

    @Column(name = "dueAt")
    private Instant dueAt;

    @Column(name = "paidAt")
    private Instant paidAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
