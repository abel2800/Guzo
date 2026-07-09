package et.guzo.repository;

import et.guzo.domain.entity.UserRole;
import et.guzo.domain.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUserId(String userId);
    void deleteByUserId(String userId);
}
