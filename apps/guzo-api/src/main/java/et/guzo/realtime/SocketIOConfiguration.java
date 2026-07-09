package et.guzo.realtime;

import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.HandshakeData;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import et.guzo.config.GuzoProperties;
import et.guzo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class SocketIOConfiguration {

    private final GuzoProperties properties;
    private final JwtService jwtService;

    @Bean
    SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(properties.getSocketPort());
        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);
        config.setAuthorizationListener(authorizationListener());
        String[] origins = Arrays.stream(properties.getCorsOrigins().split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
        if (origins.length == 0) {
            config.setOrigin("*");
        } else {
            config.setOrigin(origins[0]);
        }
        return new SocketIOServer(config);
    }

    @Bean
    SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketServer) {
        return new SpringAnnotationScanner(socketServer);
    }

    private AuthorizationListener authorizationListener() {
        return data -> {
            try {
                String token = extractToken(data);
                if (token == null || token.isBlank()) {
                    return AuthorizationResult.FAILED_AUTHORIZATION;
                }
                jwtService.verifyAccessToken(token);
                return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;
            } catch (Exception e) {
                return AuthorizationResult.FAILED_AUTHORIZATION;
            }
        };
    }

    static String extractToken(HandshakeData data) {
        Object auth = data.getAuthToken();
        if (auth != null && !auth.toString().isBlank()) {
            return auth.toString();
        }
        String bearer = data.getHttpHeaders().get("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        String param = data.getSingleUrlParam("token");
        return param != null ? param : "";
    }
}
