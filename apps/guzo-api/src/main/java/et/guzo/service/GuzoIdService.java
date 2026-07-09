package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.User;
import et.guzo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class GuzoIdService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository userRepository;

    
    @Transactional
    public String assignIfMissing(User user) {
        if (user.getGuzoId() != null && !user.getGuzoId().isBlank()) {
            return user.getGuzoId();
        }
        String guzoId;
        do {
            guzoId = "GZ-" + (100000 + RANDOM.nextInt(900000));
        } while (userRepository.existsByGuzoId(guzoId));
        user.setGuzoId(guzoId);
        userRepository.save(user);
        return guzoId;
    }

    @Transactional(readOnly = true)
    public User requireByGuzoId(String guzoId) {
        return userRepository.findByGuzoId(guzoId)
            .orElseThrow(() -> ApiException.notFound("No user found for Guzo ID " + guzoId));
    }
}
