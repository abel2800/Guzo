package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Customer;
import et.guzo.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int POINTS_PER_DELIVERY = 10;
    private static final int REFERRAL_BONUS = 50;

    private final CustomerRepository customerRepository;

    @Transactional
    public Map<String, Object> getProfile(String userId) {
        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Customer profile not found"));
        if (customer.getReferralCode() == null || customer.getReferralCode().isBlank()) {
            customer.setReferralCode("GZ" + HexFormat.of().formatHex(randomBytes(3)).toUpperCase());
            customerRepository.save(customer);
        }
        return Map.of(
            "loyaltyPoints", customer.getLoyaltyPoints(),
            "referralCode", customer.getReferralCode(),
            "pointsPerDelivery", POINTS_PER_DELIVERY,
            "referralBonus", REFERRAL_BONUS
        );
    }

    @Transactional
    public Map<String, Object> applyReferral(String userId, String code) {
        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Customer profile not found"));
        if (customer.getReferredById() != null) {
            throw ApiException.badRequest("Referral already applied");
        }
        Customer referrer = customerRepository.findByReferralCodeIgnoreCase(code.trim())
            .orElseThrow(() -> ApiException.notFound("Invalid referral code"));
        if (referrer.getId().equals(customer.getId())) {
            throw ApiException.badRequest("Cannot refer yourself");
        }
        customer.setReferredById(referrer.getId());
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + REFERRAL_BONUS);
        referrer.setLoyaltyPoints(referrer.getLoyaltyPoints() + REFERRAL_BONUS);
        customerRepository.save(customer);
        customerRepository.save(referrer);
        return Map.of("applied", true, "bonus", REFERRAL_BONUS);
    }

    private static byte[] randomBytes(int len) {
        byte[] b = new byte[len];
        RANDOM.nextBytes(b);
        return b;
    }
}
