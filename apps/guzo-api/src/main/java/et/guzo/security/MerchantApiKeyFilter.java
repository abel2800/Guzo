package et.guzo.security;

import et.guzo.domain.entity.MerchantApiKey;
import et.guzo.repository.MerchantApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class MerchantApiKeyFilter extends OncePerRequestFilter {

    public static final String MERCHANT_ID_ATTR = "merchantId";

    private final MerchantApiKeyRepository apiKeyRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().contains("/merchant-api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String raw = request.getHeader("X-Api-Key");
        if (raw == null || raw.isBlank()) {
            String auth = request.getHeader("Authorization");
            if (auth != null && auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
                raw = auth.substring(7).trim();
            }
        }
        if (raw == null || raw.isBlank()) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Missing X-Api-Key header\"}");
            return;
        }
        String[] parts = raw.split("\\.", 2);
        if (parts.length != 2) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid API key format\"}");
            return;
        }
        MerchantApiKey key = apiKeyRepository.findByKeyPrefix(parts[0])
            .orElse(null);
        if (key == null || !key.isActive()) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid API key\"}");
            return;
        }
        if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(Instant.now())) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"API key expired\"}");
            return;
        }
        String hash = TokenHasher.sha256(raw);
        if (!hash.equals(key.getKeyHash())) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid API key\"}");
            return;
        }
        key.setLastUsedAt(Instant.now());
        apiKeyRepository.save(key);
        request.setAttribute(MERCHANT_ID_ATTR, key.getMerchantId());
        chain.doFilter(request, response);
    }
}
