package et.guzo.repository;

import et.guzo.domain.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByAuthorIdAndOrderIdIn(String authorId, java.util.Collection<String> orderIds);

    boolean existsByAuthorIdAndOrderIdAndTargetType(String authorId, String orderId, et.guzo.domain.enums.ReviewTargetType targetType);

    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
