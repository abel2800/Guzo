package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_manifest_parcels")
public class ManifestParcel {

    @Id
    private String id;

    @Column(name = "manifestId", nullable = false)
    private String manifestId;

    @Column(name = "packageId", nullable = false)
    private String packageId;

    @Column(name = "scannedByUserId")
    private String scannedByUserId;

    @CreationTimestamp
    @Column(name = "scannedAt", updatable = false)
    private Instant scannedAt;

    @Column(name = "unloadedAt")
    private Instant unloadedAt;
}
