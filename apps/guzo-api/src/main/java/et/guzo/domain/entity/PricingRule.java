package et.guzo.domain.entity;

import et.guzo.domain.enums.CouponType;
import et.guzo.domain.enums.DeliveryType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "pricing_rules")
public class PricingRule {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "deliveryType", nullable = false, columnDefinition = "\"DeliveryType\"")
    private DeliveryType deliveryType = DeliveryType.STANDARD;

    @Column(name = "baseFee", nullable = false)
    private BigDecimal baseFee = BigDecimal.ZERO;

    @Column(name = "perKmFee", nullable = false)
    private BigDecimal perKmFee = BigDecimal.ZERO;

    @Column(name = "perKgFee", nullable = false)
    private BigDecimal perKgFee = BigDecimal.ZERO;

    @Column(name = "minFee", nullable = false)
    private BigDecimal minFee = BigDecimal.ZERO;

    @Column(name = "surgeMultiplier", nullable = false)
    private BigDecimal surgeMultiplier = BigDecimal.ONE;

    @Column(name = "taxPercent", nullable = false)
    private BigDecimal taxPercent = BigDecimal.ZERO;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
