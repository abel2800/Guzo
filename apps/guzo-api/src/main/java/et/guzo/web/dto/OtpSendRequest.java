package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record OtpSendRequest(@NotBlank String phone) {}
