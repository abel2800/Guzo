package et.guzo.repository;

import et.guzo.domain.entity.VehicleLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleLogRepository extends JpaRepository<VehicleLog, String> {
    List<VehicleLog> findByDriverIdOrderByLoggedAtDesc(String driverId, org.springframework.data.domain.Pageable pageable);
}
