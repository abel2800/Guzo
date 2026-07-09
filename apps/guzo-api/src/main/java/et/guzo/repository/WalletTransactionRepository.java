package et.guzo.repository;

import et.guzo.domain.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {
    Page<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
