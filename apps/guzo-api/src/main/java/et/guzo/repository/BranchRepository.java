package et.guzo.repository;

import et.guzo.domain.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, String> {
    List<Branch> findByActiveTrueAndCityIgnoreCase(String city);
    List<Branch> findByActiveTrue();
    List<Branch> findAllByOrderByCityAscNameAsc();
    long countByActiveTrue();
}
