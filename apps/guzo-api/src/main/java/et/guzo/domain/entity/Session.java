package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "userAgent")
    private String userAgent;

    @Column(name = "ipAddress")
    private String ipAddress;

    @Column(name = "isRevoked", nullable = false)
    private boolean revoked;

    @Column(name = "lastActiveAt", nullable = false)
    private Instant lastActiveAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "expiresAt", nullable = false)
    private Instant expiresAt;
}
