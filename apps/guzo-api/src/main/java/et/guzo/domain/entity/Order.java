package et.guzo.domain.entity;

import et.guzo.domain.enums.DeliveryType;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.PickupMethod;
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
@Table(name = "orders")
public class Order {

    @Id
    private String id;

    @Column(name = "orderNumber", unique = true, nullable = false)
    private String orderNumber;

    @Column(name = "customerId", nullable = false)
    private String customerId;

    @Column(name = "merchantId")
    private String merchantId;

    @Column(name = "pickupAddressId", nullable = false)
    private String pickupAddressId;

    @Column(name = "dropoffAddressId", nullable = false)
    private String dropoffAddressId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "deliveryType", nullable = false, columnDefinition = "\"DeliveryType\"")
    private DeliveryType deliveryType = DeliveryType.STANDARD;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"OrderStatus\"")
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "pickupMethod", columnDefinition = "\"PickupMethod\"")
    private PickupMethod pickupMethod;

    @Column(name = "hasInsurance", nullable = false)
    private boolean hasInsurance;

    @Column(name = "insuranceAmount")
    private BigDecimal insuranceAmount;

    @Column(name = "receiverUserId")
    private String receiverUserId;

    @Column(name = "receiverGuzoId")
    private String receiverGuzoId;

    @Column(name = "receiverPhone")
    private String receiverPhone;

    @Column(name = "originBranchId")
    private String originBranchId;

    @Column(name = "destinationBranchId")
    private String destinationBranchId;

    @Column(name = "distanceKm")
    private BigDecimal distanceKm;

    @Column(name = "baseFee", nullable = false)
    private BigDecimal baseFee = BigDecimal.ZERO;

    @Column(name = "distanceFee", nullable = false)
    private BigDecimal distanceFee = BigDecimal.ZERO;

    @Column(name = "weightFee", nullable = false)
    private BigDecimal weightFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal surge = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "totalAmount", nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private String currency = "ETB";

    private String notes;

    @Column(name = "estimatedDeliveryAt")
    private Instant estimatedDeliveryAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
