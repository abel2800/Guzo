package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_branch_inventory")
public class BranchInventory {

    @Id
    private String id;

    @Column(name = "branchId", nullable = false)
    private String branchId;

    @Column(name = "packageId", unique = true, nullable = false)
    private String packageId;

    @Column(name = "shelfCode")
    private String shelfCode;

    private String zone;

    @Column(name = "receivedAt", nullable = false)
    private Instant receivedAt;

    @Column(name = "pickedUpAt")
    private Instant pickedUpAt;

    @Column(name = "photoFileId")
    private String photoFileId;

    @Column(name = "measuredWeightKg")
    private java.math.BigDecimal measuredWeightKg;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
