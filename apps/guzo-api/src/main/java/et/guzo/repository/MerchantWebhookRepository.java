package et.guzo.repository;

import et.guzo.domain.entity.MerchantWebhook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MerchantWebhookRepository extends JpaRepository<MerchantWebhook, String> {
    List<MerchantWebhook> findByMerchantIdAndActiveTrue(String merchantId);
    List<MerchantWebhook> findByMerchantIdOrderByCreatedAtDesc(String merchantId);
}
