package et.guzo.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MarketingContactRequest(
    @NotBlank String name,
    @NotBlank @Email String email,
    String topic,
    @NotBlank String message
) {}
