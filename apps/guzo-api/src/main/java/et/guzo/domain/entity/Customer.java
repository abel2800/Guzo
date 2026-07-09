package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    private String id;

    @Column(name = "userId", unique = true, nullable = false)
    private String userId;

    @Column(name = "customerCode", unique = true, nullable = false)
    private String customerCode;

    @Column(name = "walletBalance", nullable = false)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(name = "loyaltyPoints", nullable = false)
    private int loyaltyPoints;

    @Column(name = "referralCode", unique = true)
    private String referralCode;

    @Column(name = "referredById")
    private String referredById;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
