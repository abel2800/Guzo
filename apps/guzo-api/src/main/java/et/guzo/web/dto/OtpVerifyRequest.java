package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(@NotBlank String phone, @NotBlank String code) {}
