package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "city_pricing_zones")
public class CityPricingZone {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String city;

    @Column(name = "zoneName", nullable = false)
    private String zoneName;

    @Column(nullable = false)
    private BigDecimal multiplier = BigDecimal.ONE;

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
