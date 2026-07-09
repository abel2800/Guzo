package et.guzo.domain.entity;

import et.guzo.domain.enums.InsuranceClaimStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "insurance_claims")
public class InsuranceClaim {

    @Id
    private String id;

    @Column(name = "orderId", unique = true, nullable = false)
    private String orderId;

    @Column(name = "customerId", nullable = false)
    private String customerId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"InsuranceClaimStatus\"")
    private InsuranceClaimStatus status = InsuranceClaimStatus.SUBMITTED;

    private String description;

    @Column(name = "amountClaimed")
    private BigDecimal amountClaimed;

    @Column(name = "resolutionNote")
    private String resolutionNote;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
