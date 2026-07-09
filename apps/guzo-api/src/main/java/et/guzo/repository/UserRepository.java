package et.guzo.repository;

import et.guzo.domain.entity.User;
import et.guzo.domain.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGuzoId(String guzoId);
    Optional<User> findByPhone(String phone);
    boolean existsByGuzoId(String guzoId);
    boolean existsByEmail(String email);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    @Query("""
        SELECT u FROM User u WHERE
        LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
        LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
        LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
        """)
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
}
