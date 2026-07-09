package et.guzo.realtime;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.annotation.OnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SocketChatHandler {

    private final SocketRealtimeService realtimeService;

    @OnEvent(SocketEvents.CHAT_MESSAGE)
    public void onChatMessage(SocketIOClient client, Map<String, Object> payload) {
        String fromUserId = client.get("userId");
        if (fromUserId == null) return;

        Object toUserId = payload.get("toUserId");
        Object orderId = payload.get("orderId");
        Object message = payload.get("message");
        if (toUserId == null || message == null) return;

        Map<String, Object> envelope = Map.of(
            "toUserId", toUserId.toString(),
            "orderId", orderId != null ? orderId.toString() : "",
            "message", message.toString(),
            "fromUserId", fromUserId,
            "sentAt", Instant.now().toString()
        );
        realtimeService.emitToUser(toUserId.toString(), SocketEvents.CHAT_MESSAGE, envelope);
        if (orderId != null && !orderId.toString().isBlank()) {
            realtimeService.emitToOrder(orderId.toString(), SocketEvents.CHAT_MESSAGE, envelope);
        }
    }
}
