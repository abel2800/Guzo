package et.guzo.repository;

import et.guzo.domain.entity.InsuranceClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, String> {
    Page<InsuranceClaim> findByCustomerId(String customerId, Pageable pageable);
}
