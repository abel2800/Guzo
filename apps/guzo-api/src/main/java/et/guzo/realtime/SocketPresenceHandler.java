package et.guzo.realtime;

import com.corundumstudio.socketio.annotation.OnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SocketPresenceHandler {

    private final SocketRealtimeService realtimeService;

    @OnEvent(SocketEvents.DRIVER_STATUS)
    public void onDriverStatus(Map<String, Object> payload) {
        realtimeService.emitToAdmins(SocketEvents.DRIVER_STATUS, payload);
    }
}
