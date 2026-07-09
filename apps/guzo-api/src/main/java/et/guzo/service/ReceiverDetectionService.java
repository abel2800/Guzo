package et.guzo.service;

import et.guzo.domain.entity.User;
import et.guzo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReceiverDetectionService {

    private final UserRepository userRepository;
    private final GuzoIdService guzoIdService;

    public record ReceiverMatch(
        boolean found,
        String userId,
        String guzoId,
        String firstName,
        String lastName,
        String phone,
        String matchedBy
    ) {}

    @Transactional(readOnly = true)
    public ReceiverMatch detect(String phone, String guzoId) {
        if (guzoId != null && !guzoId.isBlank()) {
            Optional<User> byGuzo = userRepository.findByGuzoId(normalizeGuzoId(guzoId));
            if (byGuzo.isPresent()) {
                User u = byGuzo.get();
                return new ReceiverMatch(true, u.getId(), u.getGuzoId(), u.getFirstName(), u.getLastName(), u.getPhone(), "GUZO_ID");
            }
        }
        if (phone != null && !phone.isBlank()) {
            String normalized = normalizePhone(phone);
            Optional<User> byPhone = userRepository.findByPhone(normalized);
            if (byPhone.isEmpty()) {
                byPhone = userRepository.findByPhone(phone.trim());
            }
            if (byPhone.isPresent()) {
                User u = byPhone.get();
                String id = u.getGuzoId();
                if (id == null || id.isBlank()) {
                    id = guzoIdService.assignIfMissing(u);
                }
                return new ReceiverMatch(true, u.getId(), id, u.getFirstName(), u.getLastName(), u.getPhone(), "PHONE");
            }
        }
        return new ReceiverMatch(false, null, null, null, null, phone, null);
    }

    private static String normalizeGuzoId(String raw) {
        String v = raw.trim().toUpperCase();
        return v.startsWith("GZ-") ? v : "GZ-" + v.replace("GZ", "").replace("-", "");
    }

    private static String normalizePhone(String raw) {
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("251") && digits.length() == 12) {
            return "+" + digits;
        }
        if (digits.length() == 10 && digits.startsWith("0")) {
            return "+251" + digits.substring(1);
        }
        if (digits.length() == 9) {
            return "+251" + digits;
        }
        return raw.trim();
    }
}
