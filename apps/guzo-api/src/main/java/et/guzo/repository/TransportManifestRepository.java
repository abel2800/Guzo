package et.guzo.repository;

import et.guzo.domain.entity.TransportManifest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportManifestRepository extends JpaRepository<TransportManifest, String> {
    List<TransportManifest> findByOriginWarehouseIdOrderByCreatedAtDesc(String originWarehouseId);
    List<TransportManifest> findByDestinationWarehouseIdOrderByCreatedAtDesc(String destinationWarehouseId);
    List<TransportManifest> findByStatusOrderByCreatedAtDesc(et.guzo.domain.enums.ManifestStatus status);
    List<TransportManifest> findByDriverIdAndStatusInOrderByCreatedAtDesc(String driverId, List<et.guzo.domain.enums.ManifestStatus> statuses);
    long countByDriverIdAndStatusIn(String driverId, List<et.guzo.domain.enums.ManifestStatus> statuses);
}
