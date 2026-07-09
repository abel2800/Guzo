package et.guzo.realtime;

import com.corundumstudio.socketio.SocketIOServer;
import et.guzo.config.GuzoProperties;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketLifecycle {

    private final SocketIOServer socketServer;
    private final GuzoProperties properties;
    private volatile boolean started;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!properties.getSocket().isEnabled() || started) {
            return;
        }
        socketServer.start();
        started = true;
        log.info("Socket.IO ready -> http://localhost:{}/socket.io/", properties.getSocketPort());
    }

    @PreDestroy
    public void onShutdown() {
        if (started) {
            socketServer.stop();
        }
    }
}
