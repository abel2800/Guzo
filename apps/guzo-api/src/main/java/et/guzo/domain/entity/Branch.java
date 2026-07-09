package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_branches")
public class Branch {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String line1;

    @Column(nullable = false)
    private String city;

    private String state;

    @Column(nullable = false)
    private String country = "ET";

    private Double latitude;
    private Double longitude;
    private String phone;

    @Column(name = "openingHours")
    private String openingHours;

    @Column(name = "queueLevel")
    private int queueLevel;

    @Column(name = "warehouseId")
    private String warehouseId;

    @Column(name = "isActive")
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
