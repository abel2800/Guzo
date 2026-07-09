package et.guzo.domain.entity;

import et.guzo.domain.enums.ManifestStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_transport_manifests")
public class TransportManifest {

    @Id
    private String id;

    @Column(name = "manifestNumber", unique = true, nullable = false)
    private String manifestNumber;

    @Column(name = "originWarehouseId")
    private String originWarehouseId;

    @Column(name = "destinationWarehouseId")
    private String destinationWarehouseId;

    @Column(name = "driverId")
    private String driverId;

    @Column(name = "vehicleId")
    private String vehicleId;

    @Column(name = "sealNumber")
    private String sealNumber;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"ManifestStatus\"")
    private ManifestStatus status = ManifestStatus.DRAFT;

    @Column(name = "departedAt")
    private Instant departedAt;

    @Column(name = "arrivedAt")
    private Instant arrivedAt;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
