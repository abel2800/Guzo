package et.guzo.repository;

import et.guzo.domain.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, String> {
    List<Address> findByUserIdOrderByCreatedAtDesc(String userId);
}
