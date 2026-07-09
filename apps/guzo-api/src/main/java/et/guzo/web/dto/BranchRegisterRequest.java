package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record BranchRegisterRequest(
    @NotBlank String senderPhone,
    String senderName,
    @NotBlank String receiverPhone,
    String receiverName,
    String receiverGuzoId,
    String destinationBranchId,
    String dropoffLine1,
    @NotBlank String dropoffCity,
    BigDecimal weightKg,
    String description,
    Boolean fragile,
    String paymentMethod
) {}
