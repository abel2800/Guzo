package et.guzo.web.dto;

import et.guzo.domain.enums.OrderStatus;

import java.math.BigDecimal;

public record PriceBreakdown(
    BigDecimal distanceKm,
    BigDecimal baseFee,
    BigDecimal distanceFee,
    BigDecimal weightFee,
    BigDecimal surge,
    BigDecimal discount,
    BigDecimal tax,
    BigDecimal totalAmount,
    String currency
) {}
