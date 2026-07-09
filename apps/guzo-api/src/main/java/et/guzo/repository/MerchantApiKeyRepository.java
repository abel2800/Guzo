package et.guzo.repository;

import et.guzo.domain.entity.MerchantApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MerchantApiKeyRepository extends JpaRepository<MerchantApiKey, String> {
    Optional<MerchantApiKey> findByKeyPrefix(String keyPrefix);
    List<MerchantApiKey> findByMerchantIdOrderByCreatedAtDesc(String merchantId);
    Optional<MerchantApiKey> findByIdAndMerchantId(String id, String merchantId);
}
