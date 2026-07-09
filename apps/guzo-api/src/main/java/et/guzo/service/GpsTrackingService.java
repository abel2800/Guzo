package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Driver;
import et.guzo.domain.entity.GpsLocation;
import et.guzo.realtime.SocketEvents;
import et.guzo.realtime.SocketRealtimeService;
import et.guzo.repository.DriverRepository;
import et.guzo.repository.GpsLocationRepository;
import et.guzo.util.IdUtil;
import et.guzo.web.dto.DriverLocationPayload;
import et.guzo.web.dto.RecordLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GpsTrackingService {

    private final DriverRepository driverRepository;
    private final GpsLocationRepository gpsLocationRepository;
    private final SocketRealtimeService realtimeService;

    @Transactional
    public DriverLocationPayload recordLocation(String userId, RecordLocationRequest dto) {
        Driver driver = driverRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.forbidden("Only drivers can record location"));

        Instant recordedAt = Instant.now();
        GpsLocation ping = new GpsLocation();
        ping.setId(IdUtil.cuid());
        ping.setDriverId(driver.getId());
        ping.setDeliveryId(dto.deliveryId());
        ping.setLatitude(dto.latitude());
        ping.setLongitude(dto.longitude());
        ping.setSpeed(dto.speed());
        ping.setHeading(dto.heading());
        ping.setAccuracy(dto.accuracy());
        ping.setRecordedAt(recordedAt);
        gpsLocationRepository.save(ping);

        driver.setCurrentLat(dto.latitude());
        driver.setCurrentLng(dto.longitude());
        driver.setUpdatedAt(recordedAt);
        driverRepository.save(driver);

        DriverLocationPayload payload = new DriverLocationPayload(
            driver.getId(),
            dto.orderId(),
            dto.latitude(),
            dto.longitude(),
            dto.heading(),
            dto.speed(),
            recordedAt.toString()
        );

        if (dto.orderId() != null) {
            realtimeService.emitToOrder(dto.orderId(), SocketEvents.ORDER_TRACKING, payload);
        }
        realtimeService.emitToAdmins(SocketEvents.DRIVER_LOCATION, payload);
        return payload;
    }

    @Transactional(readOnly = true)
    public List<GpsLocation> locationHistory(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.forbidden("Only drivers have a location history"));
        return gpsLocationRepository.findByDriverIdOrderByRecordedAtDesc(driver.getId());
    }
}
