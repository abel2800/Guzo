package et.guzo.domain.entity;

import et.guzo.domain.enums.TrackingEventType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "tracking_events")
public class TrackingEvent {

    @Id
    private String id;

    @Column(name = "orderId", nullable = false)
    private String orderId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"TrackingEventType\"")
    private TrackingEventType type;

    @Column(nullable = false)
    private String status;

    private String description;

    private Double latitude;

    private Double longitude;

    @Column(name = "locationName")
    private String locationName;

    @Column(name = "createdById")
    private String createdById;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
