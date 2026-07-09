package et.guzo.domain.entity;

import et.guzo.domain.enums.WalletTxnType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "wallet_transactions")
public class WalletTransaction {

    @Id
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"WalletTxnType\"")
    private WalletTxnType type;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "balanceAfter", nullable = false)
    private BigDecimal balanceAfter;

    @Column(nullable = false)
    private String currency = "ETB";

    private String reference;

    private String description;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
