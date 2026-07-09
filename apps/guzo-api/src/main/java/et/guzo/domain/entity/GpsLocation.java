package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "gps_locations")
public class GpsLocation {

    @Id
    private String id;

    @Column(name = "driverId", nullable = false)
    private String driverId;

    @Column(name = "deliveryId")
    private String deliveryId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    private Double speed;

    private Double heading;

    private Double accuracy;

    @Column(name = "recordedAt", nullable = false)
    private Instant recordedAt;
}
