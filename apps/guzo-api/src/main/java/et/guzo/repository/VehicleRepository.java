package et.guzo.repository;

import et.guzo.domain.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    Optional<Vehicle> findFirstByDriverIdOrderByCreatedAtDesc(String driverId);
}
