package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.FamilyMember;
import et.guzo.domain.enums.FamilyRelation;
import et.guzo.repository.FamilyMemberRepository;
import et.guzo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FamilyMember> listForOwner(String ownerUserId) {
        return familyMemberRepository.findByOwnerUserId(ownerUserId);
    }

    @Transactional
    public FamilyMember link(String ownerUserId, String memberUserId, FamilyRelation relation, String label) {
        if (ownerUserId.equals(memberUserId)) {
            throw ApiException.badRequest("Cannot link yourself as a family member");
        }
        if (!userRepository.existsById(ownerUserId) || !userRepository.existsById(memberUserId)) {
            throw ApiException.notFound("User not found");
        }
        if (familyMemberRepository.existsByOwnerUserIdAndMemberUserId(ownerUserId, memberUserId)) {
            throw ApiException.conflict("Family member already linked");
        }
        FamilyMember fm = new FamilyMember();
        fm.setId("fm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        fm.setOwnerUserId(ownerUserId);
        fm.setMemberUserId(memberUserId);
        fm.setRelation(relation != null ? relation : FamilyRelation.OTHER);
        fm.setLabel(label);
        return familyMemberRepository.save(fm);
    }
}
