package et.guzo.domain.entity;

import et.guzo.domain.enums.DriverApprovalStatus;
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
@Table(name = "drivers")
public class Driver {

    @Id
    private String id;

    @Column(name = "userId", unique = true, nullable = false)
    private String userId;

    @Column(name = "driverCode", unique = true, nullable = false)
    private String driverCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "approvalStatus", nullable = false, columnDefinition = "\"DriverApprovalStatus\"")
    private DriverApprovalStatus approvalStatus = DriverApprovalStatus.PENDING;

    @Column(nullable = false)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "totalDeliveries", nullable = false)
    private int totalDeliveries;

    @Column(name = "earningsBalance", nullable = false)
    private BigDecimal earningsBalance = BigDecimal.ZERO;

    @Column(name = "isAvailable", nullable = false)
    private boolean available;

    @Column(name = "currentLat")
    private Double currentLat;

    @Column(name = "currentLng")
    private Double currentLng;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
