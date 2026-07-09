package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_webhook_deliveries")
public class WebhookDelivery {

    @Id
    private String id;

    @Column(name = "webhookId", nullable = false)
    private String webhookId;

    @Column(name = "eventType", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String payload;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private int attempts;

    @Column(name = "lastError")
    private String lastError;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "deliveredAt")
    private Instant deliveredAt;
}
