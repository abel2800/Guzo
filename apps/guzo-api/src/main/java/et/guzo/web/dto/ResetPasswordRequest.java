package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    String email,
    String phone,
    @NotBlank @Size(min = 8) String password,
    String token
) {}
