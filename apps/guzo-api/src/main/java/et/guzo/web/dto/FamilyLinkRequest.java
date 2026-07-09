package et.guzo.web.dto;

import et.guzo.domain.enums.FamilyRelation;
import jakarta.validation.constraints.NotBlank;

public record FamilyLinkRequest(
    @NotBlank String ownerUserId,
    @NotBlank String memberUserId,
    FamilyRelation relation,
    String label
) {}
