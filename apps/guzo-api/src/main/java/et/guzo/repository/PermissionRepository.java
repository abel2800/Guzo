package et.guzo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import et.guzo.domain.entity.Permission;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {

    @Query(value = """
        SELECT DISTINCT p.key FROM permissions p
        JOIN role_permissions rp ON rp."permissionId" = p.id
        JOIN user_roles ur ON ur."roleId" = rp."roleId"
        WHERE ur."userId" = :userId
        """, nativeQuery = true)
    List<String> findPermissionKeysByUserId(@Param("userId") String userId);
}
