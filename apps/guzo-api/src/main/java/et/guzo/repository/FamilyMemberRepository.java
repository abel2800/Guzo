package et.guzo.repository;

import et.guzo.domain.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, String> {
    List<FamilyMember> findByOwnerUserId(String ownerUserId);
    boolean existsByOwnerUserIdAndMemberUserId(String ownerUserId, String memberUserId);
}
