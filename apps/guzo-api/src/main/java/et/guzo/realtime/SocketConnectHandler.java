package et.guzo.realtime;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import et.guzo.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketConnectHandler {

    private static final Set<String> ADMIN_ROOM_ROLES = Set.of("ADMIN", "SUPER_ADMIN");

    private final JwtService jwtService;

    @OnConnect
    public void onConnect(SocketIOClient client) {
        try {
            String token = SocketIOConfiguration.extractToken(client.getHandshakeData());
            Claims claims = jwtService.verifyAccessToken(token);
            String userId = claims.getSubject();
            client.set("userId", userId);
            client.joinRoom(SocketRooms.user(userId));

            @SuppressWarnings("unchecked")
            List<String> roles = claims.get("roles", List.class);
            if (roles != null && roles.stream().anyMatch(ADMIN_ROOM_ROLES::contains)) {
                client.joinRoom(SocketRooms.admins());
            }
            log.debug("socket connected: user={} id={}", userId, client.getSessionId());
        } catch (Exception e) {
            client.disconnect();
        }
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        log.debug("socket disconnected: {}", client.getSessionId());
    }
}
