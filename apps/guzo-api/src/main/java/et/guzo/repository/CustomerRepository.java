package et.guzo.repository;

import et.guzo.domain.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUserId(String userId);
    Optional<Customer> findByReferralCodeIgnoreCase(String referralCode);
}
