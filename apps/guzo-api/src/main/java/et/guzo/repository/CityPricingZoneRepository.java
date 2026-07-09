package et.guzo.repository;

import et.guzo.domain.entity.CityPricingZone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CityPricingZoneRepository extends JpaRepository<CityPricingZone, String> {
    Optional<CityPricingZone> findByCityIgnoreCase(String city);

    Page<CityPricingZone> findByCityContainingIgnoreCaseOrZoneNameContainingIgnoreCase(
        String city, String zoneName, Pageable pageable);
}
