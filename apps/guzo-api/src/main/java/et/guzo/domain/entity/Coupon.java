package et.guzo.domain.entity;

import et.guzo.domain.enums.CouponType;
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
@Table(name = "coupons")
public class Coupon {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"CouponType\"")
    private CouponType type = CouponType.PERCENTAGE;

    @Column(nullable = false)
    private BigDecimal value;

    @Column(name = "maxDiscount")
    private BigDecimal maxDiscount;

    @Column(name = "minOrderAmount")
    private BigDecimal minOrderAmount;

    @Column(name = "usageLimit")
    private Integer usageLimit;

    @Column(name = "perUserLimit", nullable = false)
    private int perUserLimit = 1;

    @Column(name = "usedCount", nullable = false)
    private int usedCount;

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @Column(name = "startsAt")
    private Instant startsAt;

    @Column(name = "expiresAt")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
