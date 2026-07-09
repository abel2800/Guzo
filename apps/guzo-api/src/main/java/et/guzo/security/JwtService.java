package et.guzo.security;

import et.guzo.config.GuzoProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final GuzoProperties properties;

    public String signAccessToken(String userId, String email, List<String> roles, String sessionId) {
        Instant now = Instant.now();
        Instant exp = now.plus(properties.getJwt().getAccessExpiresMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
            .claims(Map.of("email", email, "roles", roles, "sessionId", sessionId != null ? sessionId : "", "type", "access"))
            .subject(userId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(accessKey())
            .compact();
    }

    public String signRefreshToken(String userId, String sessionId) {
        Instant now = Instant.now();
        Instant exp = now.plus(properties.getJwt().getRefreshExpiresDays(), ChronoUnit.DAYS);
        return Jwts.builder()
            .claim("type", "refresh")
            .claim("sessionId", sessionId)
            .subject(userId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(refreshKey())
            .compact();
    }

    public Claims verifyAccessToken(String token) {
        Claims claims = parse(token, accessKey());
        if (!"access".equals(claims.get("type"))) throw new IllegalArgumentException("Not an access token");
        return claims;
    }

    public Claims verifyRefreshToken(String token) {
        Claims claims = parse(token, refreshKey());
        if (!"refresh".equals(claims.get("type"))) throw new IllegalArgumentException("Not a refresh token");
        return claims;
    }

    private Claims parse(String token, SecretKey key) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    private SecretKey accessKey() {
        return Keys.hmacShaKeyFor(properties.getJwt().getAccessSecret().getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey refreshKey() {
        return Keys.hmacShaKeyFor(properties.getJwt().getRefreshSecret().getBytes(StandardCharsets.UTF_8));
    }
}
