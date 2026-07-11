package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.PhoneOtp;
import et.guzo.repository.PhoneOtpRepository;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PhoneOtpRepository phoneOtpRepository;
    private final SmsService smsService;

    @Transactional
    public String send(String phone) {
        String normalized = normalizePhone(phone);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant now = Instant.now();
        PhoneOtp otp = new PhoneOtp();
        otp.setId(IdUtil.cuid());
        otp.setPhone(normalized);
        otp.setCode(code);
        otp.setExpiresAt(now.plus(10, ChronoUnit.MINUTES));
        otp.setCreatedAt(now);
        phoneOtpRepository.save(otp);
        smsService.send(normalized, "Your Guzo verification code is: " + code);
        log.debug("OTP generated for {}", normalized);
        return normalized;
    }

    @Transactional
    public void verify(String phone, String code) {
        String normalized = normalizePhone(phone);
        PhoneOtp otp = phoneOtpRepository.findTopByPhoneAndVerifiedAtIsNullOrderByCreatedAtDesc(normalized)
            .orElseThrow(() -> ApiException.badRequest("No OTP pending for this phone"));
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("OTP expired");
        }
        if (!otp.getCode().equals(code)) {
            throw ApiException.badRequest("Invalid OTP");
        }
        otp.setVerifiedAt(Instant.now());
        phoneOtpRepository.save(otp);
    }

    @Transactional(readOnly = true)
    public void assertRecentlyVerified(String phone) {
        String normalized = normalizePhone(phone);
        PhoneOtp otp = phoneOtpRepository.findTopByPhoneAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(normalized)
            .orElseThrow(() -> ApiException.badRequest("Phone not verified — complete OTP verification first"));
        if (otp.getVerifiedAt().isBefore(Instant.now().minus(30, ChronoUnit.MINUTES))) {
            throw ApiException.badRequest("Phone verification expired — request a new OTP");
        }
    }

    private static String normalizePhone(String raw) {
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("251") && digits.length() == 12) return "+" + digits;
        if (digits.length() == 10 && digits.startsWith("0")) return "+251" + digits.substring(1);
        if (digits.length() == 9) return "+251" + digits;
        return raw.trim();
    }
}
