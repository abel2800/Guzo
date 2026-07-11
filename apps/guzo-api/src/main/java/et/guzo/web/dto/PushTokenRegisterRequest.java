package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PushTokenRegisterRequest(
    @NotBlank String token,
    @NotBlank String platform,
    @NotBlank String appSlug
) {}
