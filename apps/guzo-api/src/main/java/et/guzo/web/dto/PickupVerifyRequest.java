package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PickupVerifyRequest(@NotBlank String reference, String pin) {}
