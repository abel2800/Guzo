package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    private String id;

    @Column(name = "userId")
    private String userId;

    @Column(nullable = false)
    private String action;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    @Column(name = "ipAddress")
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;
}
