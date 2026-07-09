package et.guzo.domain.entity;

import et.guzo.domain.enums.PackageStatus;
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
@Table(name = "packages")
public class Package {

    @Id
    private String id;

    @Column(name = "trackingNumber", unique = true, nullable = false)
    private String trackingNumber;

    @Column(name = "orderId", nullable = false)
    private String orderId;

    @Column(name = "weightKg", nullable = false)
    private BigDecimal weightKg = BigDecimal.ZERO;

    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"PackageStatus\"")
    private PackageStatus status = PackageStatus.CREATED;

    @Column(name = "isFragile", nullable = false)
    private boolean fragile;

    @Column(name = "qrCode")
    private String qrCode;

    @Column(name = "pickupPin")
    private String pickupPin;

    @Column(name = "warehouseId")
    private String warehouseId;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
