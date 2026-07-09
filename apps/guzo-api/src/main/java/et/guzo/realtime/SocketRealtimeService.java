package et.guzo.realtime;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SocketRealtimeService {

    private final SocketIOServer socketServer;

    public void emitToUser(String userId, String event, Object payload) {
        if (userId == null) return;
        socketServer.getRoomOperations(SocketRooms.user(userId)).sendEvent(event, payload);
    }

    public void emitToOrder(String orderId, String event, Object payload) {
        if (orderId == null) return;
        socketServer.getRoomOperations(SocketRooms.order(orderId)).sendEvent(event, payload);
    }

    public void emitToAdmins(String event, Object payload) {
        socketServer.getRoomOperations(SocketRooms.admins()).sendEvent(event, payload);
    }
}
