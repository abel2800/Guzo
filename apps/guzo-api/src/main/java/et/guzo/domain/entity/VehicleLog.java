package et.guzo.domain.entity;

import et.guzo.domain.enums.VehicleLogType;
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
@Table(name = "vehicle_logs")
public class VehicleLog {

    @Id
    private String id;

    @Column(name = "vehicleId", nullable = false)
    private String vehicleId;

    @Column(name = "driverId", nullable = false)
    private String driverId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"VehicleLogType\"")
    private VehicleLogType type;

    @Column(name = "odometerKm")
    private BigDecimal odometerKm;

    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "ETB";

    private String note;

    @Column(name = "loggedAt", nullable = false)
    private Instant loggedAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
