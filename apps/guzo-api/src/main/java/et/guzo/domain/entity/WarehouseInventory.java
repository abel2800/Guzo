package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "warehouse_inventory")
public class WarehouseInventory {

    @Id
    private String id;

    @Column(name = "warehouseId", nullable = false)
    private String warehouseId;

    @Column(name = "packageId", unique = true, nullable = false)
    private String packageId;

    @Column(name = "shelfCode")
    private String shelfCode;

    private String zone;

    @Column(name = "receivedAt", nullable = false)
    private Instant receivedAt;

    @Column(name = "dispatchedAt")
    private Instant dispatchedAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
