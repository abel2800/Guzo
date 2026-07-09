package et.guzo.repository;

import et.guzo.domain.entity.PhoneOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, String> {
    Optional<PhoneOtp> findTopByPhoneAndVerifiedAtIsNullOrderByCreatedAtDesc(String phone);

    Optional<PhoneOtp> findTopByPhoneAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(String phone);
}
