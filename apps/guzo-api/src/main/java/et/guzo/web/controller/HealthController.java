package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.domain.entity.User;
import et.guzo.repository.UserRepository;
import et.guzo.security.SecurityUtil;
import et.guzo.service.GuzoIdService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final UserRepository userRepository;
    private final GuzoIdService guzoIdService;

    private static final Instant STARTED = Instant.now();

    @GetMapping("/")
    public ApiResponse<Map<String, Object>> root() {
        return ApiResponse.ok(Map.of(
            "name", "GUZO API",
            "version", "0.1.0",
            "runtime", "Java Spring Boot",
            "phase", "0-complete"
        ));
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of(
            "status", "ok",
            "uptime", java.time.Duration.between(STARTED, Instant.now()).getSeconds(),
            "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/users/{userId}/guzo-id")
    public ApiResponse<Map<String, String>> assignGuzoId(@PathVariable String userId) {
        var auth = SecurityUtil.requireUser();
        if (!auth.getId().equals(userId) && !et.guzo.security.RoleChecker.isAdmin(auth)) {
            throw et.guzo.common.ApiException.forbidden("Not allowed");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> et.guzo.common.ApiException.notFound("User not found"));
        String guzoId = guzoIdService.assignIfMissing(user);
        return ApiResponse.ok(Map.of("userId", userId, "guzoId", guzoId), "Guzo ID assigned");
    }
}
