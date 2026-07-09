package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "merchants")
public class Merchant {

    @Id
    private String id;

    @Column(name = "userId", unique = true, nullable = false)
    private String userId;

    @Column(name = "merchantCode", unique = true, nullable = false)
    private String merchantCode;

    @Column(name = "businessName", nullable = false)
    private String businessName;

    @Column(name = "walletBalance", nullable = false)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(name = "isVerified", nullable = false)
    private boolean verified;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
