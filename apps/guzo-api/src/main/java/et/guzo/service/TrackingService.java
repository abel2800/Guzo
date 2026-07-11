package et.guzo.service;

import et.guzo.domain.entity.TrackingEvent;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.TrackingEventType;
import et.guzo.repository.TrackingEventRepository;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrackingService {

    private final TrackingEventRepository trackingEventRepository;

    @Transactional
    public TrackingEvent record(String orderId, TrackingEventType type, OrderStatus status, String description, String createdById) {
        return record(orderId, type, status, description, createdById, null, null);
    }

    @Transactional
    public TrackingEvent record(String orderId, TrackingEventType type, OrderStatus status, String description,
                                String createdById, Double latitude, Double longitude) {
        return record(orderId, type, status.name(), description, createdById, latitude, longitude);
    }

    @Transactional
    public TrackingEvent record(String orderId, TrackingEventType type, String status, String description,
                                String createdById, Double latitude, Double longitude) {
        TrackingEvent event = new TrackingEvent();
        event.setId(IdUtil.cuid());
        event.setOrderId(orderId);
        event.setType(type);
        event.setStatus(status);
        event.setDescription(description);
        event.setLatitude(latitude);
        event.setLongitude(longitude);
        event.setCreatedById(createdById);
        event.setCreatedAt(Instant.now());
        return trackingEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<TrackingEvent> listForOrder(String orderId) {
        return trackingEventRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }
}
