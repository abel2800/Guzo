package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "merchant_api_keys")
public class MerchantApiKey {

    @Id
    private String id;

    @Column(name = "merchantId", nullable = false)
    private String merchantId;

    @Column(nullable = false)
    private String label;

    @Column(name = "keyPrefix", unique = true, nullable = false)
    private String keyPrefix;

    @Column(name = "keyHash", nullable = false)
    private String keyHash;

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @Column(name = "lastUsedAt")
    private Instant lastUsedAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "expiresAt")
    private Instant expiresAt;
}
