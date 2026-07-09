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
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    @Column(name = "actorId")
    private String actorId;

    @Column(nullable = false)
    private String action;

    @Column(name = "entityType", nullable = false)
    private String entityType;

    @Column(name = "entityId")
    private String entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> before;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> after;

    @Column(name = "ipAddress")
    private String ipAddress;

    @Column(name = "userAgent")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;
}
