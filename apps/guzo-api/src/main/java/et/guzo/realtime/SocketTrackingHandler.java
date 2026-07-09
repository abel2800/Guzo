package et.guzo.realtime;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.annotation.OnEvent;
import et.guzo.service.GpsTrackingService;
import et.guzo.web.dto.DriverLocationPayload;
import et.guzo.web.dto.RecordLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SocketTrackingHandler {

    private final GpsTrackingService gpsTrackingService;

    @OnEvent(SocketEvents.DRIVER_LOCATION)
    public void onDriverLocation(SocketIOClient client, DriverLocationPayload payload) {
        String userId = client.get("userId");
        if (userId == null) return;

        RecordLocationRequest request = new RecordLocationRequest(
            payload.orderId(),
            null,
            payload.lat(),
            payload.lng(),
            payload.speed(),
            payload.heading(),
            null
        );
        gpsTrackingService.recordLocation(userId, request);
    }

    @OnEvent(SocketEvents.ORDER_SUBSCRIBE)
    public void onOrderSubscribe(SocketIOClient client, String orderId) {
        if (orderId != null && !orderId.isBlank()) {
            client.joinRoom(SocketRooms.order(orderId));
        }
    }

    @OnEvent(SocketEvents.ORDER_UNSUBSCRIBE)
    public void onOrderUnsubscribe(SocketIOClient client, String orderId) {
        if (orderId != null && !orderId.isBlank()) {
            client.leaveRoom(SocketRooms.order(orderId));
        }
    }
}
