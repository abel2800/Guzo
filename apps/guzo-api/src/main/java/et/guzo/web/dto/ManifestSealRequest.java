package et.guzo.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ManifestSealRequest(@NotBlank String sealNumber) {}
