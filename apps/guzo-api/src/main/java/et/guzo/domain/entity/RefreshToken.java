package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "sessionId")
    private String sessionId;

    @Column(name = "tokenHash", unique = true, nullable = false)
    private String tokenHash;

    @Column(name = "isRevoked", nullable = false)
    private boolean revoked;

    @Column(name = "userAgent")
    private String userAgent;

    @Column(name = "ipAddress")
    private String ipAddress;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "expiresAt", nullable = false)
    private Instant expiresAt;

    @Column(name = "revokedAt")
    private Instant revokedAt;
}
