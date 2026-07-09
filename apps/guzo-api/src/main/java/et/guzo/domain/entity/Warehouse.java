package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "warehouses")
public class Warehouse {

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

    @Column(nullable = false)
    private int capacity;

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
