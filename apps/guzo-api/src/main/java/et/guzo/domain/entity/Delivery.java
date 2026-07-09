package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    private String id;

    @Column(name = "orderId", unique = true, nullable = false)
    private String orderId;

    @Column(name = "driverId")
    private String driverId;

    @Column(name = "assignedAt")
    private Instant assignedAt;

    @Column(name = "acceptedAt")
    private Instant acceptedAt;

    @Column(name = "deliveredAt")
    private Instant deliveredAt;

    @Column(name = "failedAt")
    private Instant failedAt;

    @Column(name = "failureReason")
    private String failureReason;

    @Column(name = "recipientName")
    private String recipientName;

    @Column(name = "proofFileId")
    private String proofFileId;

    @Column(name = "signatureFileId")
    private String signatureFileId;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
