package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_merchant_webhooks")
public class MerchantWebhook {

    @Id
    private String id;

    @Column(name = "merchantId", nullable = false)
    private String merchantId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private String events = "parcel.status_changed";

    @Column(name = "isActive", nullable = false)
    private boolean active = true;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
