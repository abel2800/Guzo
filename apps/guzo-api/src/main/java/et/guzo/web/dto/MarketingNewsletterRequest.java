package et.guzo.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MarketingNewsletterRequest(
    @NotBlank @Email String email
) {}
