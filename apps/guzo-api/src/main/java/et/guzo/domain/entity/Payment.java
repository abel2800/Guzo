package et.guzo.domain.entity;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
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
@Table(name = "payments")
public class Payment {

    @Id
    private String id;

    @Column(name = "orderId", unique = true, nullable = false)
    private String orderId;

    @Column(unique = true, nullable = false)
    private String reference;

    @Column(nullable = false)
    private String provider = "fake";

    @Column(name = "providerRef")
    private String providerRef;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"PaymentMethod\"")
    private PaymentMethod method = PaymentMethod.FAKE;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"PaymentStatus\"")
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "paidAt")
    private Instant paidAt;

    @Column(name = "refundedAmount", nullable = false)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
