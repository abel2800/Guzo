package et.guzo.repository;

import et.guzo.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndReadAtIsNull(String userId);
    long countByUserIdAndReadAtIsNull(String userId);
    org.springframework.data.domain.Page<Notification> findByUserId(String userId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Notification> findByUserIdAndReadAtIsNull(String userId, org.springframework.data.domain.Pageable pageable);
}
