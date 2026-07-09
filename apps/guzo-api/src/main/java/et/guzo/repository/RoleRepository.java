package et.guzo.repository;

import et.guzo.domain.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByName(String name);

    @Query(value = "SELECT r.name FROM roles r JOIN user_roles ur ON ur.\"roleId\" = r.id WHERE ur.\"userId\" = :userId", nativeQuery = true)
    List<String> findRoleNamesByUserId(@Param("userId") String userId);
}
