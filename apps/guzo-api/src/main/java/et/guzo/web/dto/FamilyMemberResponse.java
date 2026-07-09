package et.guzo.web.dto;

import et.guzo.domain.entity.FamilyMember;

public record FamilyMemberResponse(String id, String ownerUserId, String memberUserId, String relation, String label) {
    public static FamilyMemberResponse from(FamilyMember fm) {
        return new FamilyMemberResponse(fm.getId(), fm.getOwnerUserId(), fm.getMemberUserId(), fm.getRelation().name(), fm.getLabel());
    }
}
