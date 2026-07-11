package et.guzo.repository;

import et.guzo.domain.entity.PushDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PushDeviceRepository extends JpaRepository<PushDevice, String> {
    Optional<PushDevice> findByToken(String token);

    void deleteByTokenAndUserId(String token, String userId);
}
