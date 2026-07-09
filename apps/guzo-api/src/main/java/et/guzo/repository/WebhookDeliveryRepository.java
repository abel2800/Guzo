package et.guzo.repository;

import et.guzo.domain.entity.WebhookDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, String> {

    @Query(value = """
        SELECT * FROM guzo_webhook_deliveries
        WHERE status IN (?1, ?2)
        ORDER BY "createdAt" ASC
        LIMIT 20
        """, nativeQuery = true)
    List<WebhookDelivery> findPending(String status1, String status2);
}
