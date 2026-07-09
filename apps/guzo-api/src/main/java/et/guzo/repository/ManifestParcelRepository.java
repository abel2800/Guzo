package et.guzo.repository;

import et.guzo.domain.entity.ManifestParcel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManifestParcelRepository extends JpaRepository<ManifestParcel, String> {
    List<ManifestParcel> findByManifestId(String manifestId);
}
