package et.guzo.repository;

import et.guzo.domain.entity.GpsLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GpsLocationRepository extends JpaRepository<GpsLocation, String> {
    List<GpsLocation> findByDriverIdOrderByRecordedAtDesc(String driverId);
}
