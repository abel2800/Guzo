package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record InsuranceClaimCreateRequest(
    @NotBlank String orderId,
    String description,
    BigDecimal amountClaimed
) {}
