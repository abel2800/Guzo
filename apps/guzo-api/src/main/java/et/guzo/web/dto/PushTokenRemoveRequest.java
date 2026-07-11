package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PushTokenRemoveRequest(
    @NotBlank String token
) {}
