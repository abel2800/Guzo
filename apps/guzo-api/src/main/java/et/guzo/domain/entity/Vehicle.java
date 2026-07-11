package et.guzo.domain.entity;

import et.guzo.domain.enums.VehicleStatus;
import et.guzo.domain.enums.VehicleType;
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
@Table(name = "vehicles")
public class Vehicle {

    @Id
    private String id;

    @Column(name = "driverId")
    private String driverId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"VehicleType\"")
    private VehicleType type;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"VehicleStatus\"")
    private VehicleStatus status = VehicleStatus.ACTIVE;

    @Column(name = "plateNumber", unique = true, nullable = false)
    private String plateNumber;

    private String brand;

    private String model;

    private String color;

    @Column(name = "photoFileId")
    private String photoFileId;

    @Column(name = "capacityKg")
    private BigDecimal capacityKg;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
