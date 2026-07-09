package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Driver;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.TransportManifest;
import et.guzo.domain.entity.Vehicle;
import et.guzo.domain.entity.VehicleLog;
import et.guzo.domain.enums.ManifestStatus;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.VehicleLogType;
import et.guzo.domain.enums.WalletTxnType;
import et.guzo.repository.DriverRepository;
import et.guzo.repository.ManifestParcelRepository;
import et.guzo.repository.TransportManifestRepository;
import et.guzo.repository.WalletTransactionRepository;
import et.guzo.repository.VehicleLogRepository;
import et.guzo.repository.VehicleRepository;
import et.guzo.repository.DeliveryRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.repository.AddressRepository;
import et.guzo.domain.entity.Address;
import et.guzo.domain.entity.Delivery;
import et.guzo.util.IdUtil;
import et.guzo.security.AuthUser;
import et.guzo.security.RoleChecker;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DriverOpsService {

    private final DriverRepository driverRepository;
    private final TransportManifestRepository manifestRepository;
    private final ManifestParcelRepository manifestParcelRepository;
    private final TransportManifestService manifestService;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;

    private Driver requireDriver(String userId) {
        return driverRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
    }

    private void assertManifestDriver(TransportManifest manifest, String driverId) {
        if (manifest.getDriverId() == null || !manifest.getDriverId().equals(driverId)) {
            throw ApiException.forbidden("This manifest is not assigned to you");
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listManifests(String userId) {
        Driver driver = requireDriver(userId);
        List<ManifestStatus> statuses = List.of(ManifestStatus.DRAFT, ManifestStatus.SEALED, ManifestStatus.IN_TRANSIT, ManifestStatus.ARRIVED);
        return manifestRepository.findByDriverIdAndStatusInOrderByCreatedAtDesc(driver.getId(), statuses).stream()
            .map(m -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", m.getId());
                row.put("manifestNumber", m.getManifestNumber());
                row.put("status", m.getStatus().name());
                row.put("sealNumber", m.getSealNumber());
                row.put("parcelCount", manifestParcelRepository.findByManifestId(m.getId()).size());
                row.put("departedAt", m.getDepartedAt());
                row.put("arrivedAt", m.getArrivedAt());
                return row;
            }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getManifest(String userId, String manifestId) {
        Driver driver = requireDriver(userId);
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        assertManifestDriver(manifest, driver.getId());
        return manifestService.getDetail(manifestId);
    }

    @Transactional
    public Object scanManifest(String userId, String manifestId, String trackingNumber) {
        Driver driver = requireDriver(userId);
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        assertManifestDriver(manifest, driver.getId());
        return manifestService.scanParcel(manifestId, null, trackingNumber, userId);
    }

    @Transactional
    public TransportManifest departManifest(String userId, String manifestId, String sealNumber) {
        Driver driver = requireDriver(userId);
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        assertManifestDriver(manifest, driver.getId());
        return manifestService.sealAndDepart(manifestId, sealNumber != null ? sealNumber : "SEAL-" + System.currentTimeMillis());
    }

    @Transactional
    public TransportManifest arriveManifest(String userId, String manifestId) {
        Driver driver = requireDriver(userId);
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        assertManifestDriver(manifest, driver.getId());
        return manifestService.markArrived(manifestId);
    }

    @Transactional
    public Map<String, Object> unloadManifest(AuthUser user, String manifestId, String trackingNumber) {
        Driver driver = requireDriver(user.getId());
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        assertManifestDriver(manifest, driver.getId());
        return manifestService.unloadScan(manifestId, trackingNumber, user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEarnings(String userId) {
        Driver driver = requireDriver(userId);
        var txns = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(driver.getUserId(), PageRequest.of(0, 50));
        List<Map<String, Object>> transactions = txns.getContent().stream()
            .filter(t -> t.getType() == WalletTxnType.CREDIT)
            .map(t -> Map.<String, Object>of(
                "id", t.getId(),
                "amount", t.getAmount(),
                "balanceAfter", t.getBalanceAfter(),
                "currency", t.getCurrency(),
                "reference", t.getReference() != null ? t.getReference() : "",
                "description", t.getDescription() != null ? t.getDescription() : "",
                "createdAt", t.getCreatedAt().toString()
            )).toList();
        return Map.of(
            "balance", driver.getEarningsBalance(),
            "totalDeliveries", driver.getTotalDeliveries(),
            "transactions", transactions
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyVehicle(String userId) {
        Driver driver = requireDriver(userId);
        return vehicleRepository.findFirstByDriverIdOrderByCreatedAtDesc(driver.getId())
            .map(v -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", v.getId());
                row.put("plateNumber", v.getPlateNumber());
                row.put("type", v.getType().name());
                row.put("status", v.getStatus().name());
                row.put("brand", v.getBrand());
                row.put("model", v.getModel());
                row.put("color", v.getColor());
                return row;
            })
            .orElse(null);
    }

    @Transactional
    public Map<String, Object> createVehicleLog(String userId, VehicleLogType type, BigDecimal odometerKm, BigDecimal amount, String note) {
        Driver driver = requireDriver(userId);
        Vehicle vehicle = vehicleRepository.findFirstByDriverIdOrderByCreatedAtDesc(driver.getId())
            .orElseThrow(() -> ApiException.badRequest("No vehicle assigned to your driver profile"));
        Instant now = Instant.now();
        VehicleLog log = new VehicleLog();
        log.setId(IdUtil.cuid());
        log.setVehicleId(vehicle.getId());
        log.setDriverId(driver.getId());
        log.setType(type);
        log.setOdometerKm(odometerKm);
        log.setAmount(amount);
        log.setNote(note);
        log.setLoggedAt(now);
        log.setCreatedAt(now);
        vehicleLogRepository.save(log);
        return Map.of(
            "id", log.getId(),
            "type", log.getType().name(),
            "odometerKm", log.getOdometerKm(),
            "amount", log.getAmount(),
            "note", log.getNote() != null ? log.getNote() : "",
            "loggedAt", log.getLoggedAt().toString()
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listVehicleLogs(String userId, int limit) {
        Driver driver = requireDriver(userId);
        return vehicleLogRepository.findByDriverIdOrderByLoggedAtDesc(driver.getId(), PageRequest.of(0, limit)).stream()
            .map(l -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", l.getId());
                row.put("type", l.getType().name());
                row.put("odometerKm", l.getOdometerKm());
                row.put("amount", l.getAmount());
                row.put("note", l.getNote());
                row.put("loggedAt", l.getLoggedAt().toString());
                return row;
            }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> optimizedRoute(String userId) {
        Driver driver = requireDriver(userId);
        List<Delivery> deliveries = deliveryRepository.findByDriverIdAndDeliveredAtIsNull(driver.getId());

        Set<OrderStatus> pickupStatuses = EnumSet.of(OrderStatus.ASSIGNED, OrderStatus.CONFIRMED, OrderStatus.PICKED_UP);
        Set<OrderStatus> dropStatuses = EnumSet.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.IN_TRANSIT);

        List<Map<String, Object>> candidates = new ArrayList<>();
        for (Delivery d : deliveries) {
            Order order = orderRepository.findById(d.getOrderId()).orElse(null);
            if (order == null) continue;
            if (pickupStatuses.contains(order.getStatus())) {
                Address addr = addressRepository.findById(order.getPickupAddressId()).orElse(null);
                if (addr != null) {
                    candidates.add(stop(order, "pickup", addr));
                }
            }
            if (dropStatuses.contains(order.getStatus())) {
                Address addr = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
                if (addr != null) {
                    candidates.add(stop(order, "dropoff", addr));
                }
            }
        }

        List<Map<String, Object>> withCoords = new ArrayList<>();
        List<Map<String, Object>> withoutCoords = new ArrayList<>();
        for (Map<String, Object> c : candidates) {
            if (c.get("latitude") != null && c.get("longitude") != null) {
                withCoords.add(c);
            } else {
                withoutCoords.add(c);
            }
        }

        Double curLat = driver.getCurrentLat();
        Double curLng = driver.getCurrentLng();
        if ((curLat == null || curLng == null) && !withCoords.isEmpty()) {
            curLat = (Double) withCoords.get(0).get("latitude");
            curLng = (Double) withCoords.get(0).get("longitude");
        }

        List<Map<String, Object>> ordered = new ArrayList<>();
        List<Map<String, Object>> remaining = new ArrayList<>(withCoords);
        double totalKm = 0;

        while (!remaining.isEmpty() && curLat != null && curLng != null) {
            int bestIdx = 0;
            double bestDist = Double.MAX_VALUE;
            for (int i = 0; i < remaining.size(); i++) {
                Map<String, Object> s = remaining.get(i);
                double dist = haversineKm(curLat, curLng, (Double) s.get("latitude"), (Double) s.get("longitude"));
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            Map<String, Object> next = remaining.remove(bestIdx);
            totalKm += bestDist == Double.MAX_VALUE ? 0 : bestDist;
            ordered.add(next);
            curLat = (Double) next.get("latitude");
            curLng = (Double) next.get("longitude");
        }

        List<Map<String, Object>> stops = new ArrayList<>(ordered);
        stops.addAll(withoutCoords);

        return Map.of(
            "stops", stops,
            "totalStops", stops.size(),
            "estimatedKm", Math.round(totalKm * 100.0) / 100.0
        );
    }

    private static Map<String, Object> stop(Order order, String type, Address addr) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("orderId", order.getId());
        row.put("orderNumber", order.getOrderNumber());
        row.put("type", type);
        row.put("line1", addr.getLine1());
        row.put("city", addr.getCity());
        row.put("latitude", addr.getLatitude());
        row.put("longitude", addr.getLongitude());
        return row;
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
