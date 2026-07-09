package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.ManifestStatus;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.PackageStatus;
import et.guzo.domain.enums.TrackingEventType;
import et.guzo.repository.*;
import et.guzo.security.AuthUser;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TransportManifestService {

    private final TransportManifestRepository manifestRepository;
    private final ManifestParcelRepository manifestParcelRepository;
    private final PackageRepository packageRepository;
    private final OrderRepository orderRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final CustomerRepository customerRepository;
    private final TrackingService trackingService;
    private final NotificationService notificationService;
    private final WarehouseOpsService warehouseOpsService;

    @Transactional
    public TransportManifest createDraft(String originWarehouseId, String destinationWarehouseId, String driverId) {
        warehouseRepository.findById(originWarehouseId).orElseThrow(() -> ApiException.notFound("Origin warehouse not found"));
        if (destinationWarehouseId != null && !destinationWarehouseId.isBlank()) {
            warehouseRepository.findById(destinationWarehouseId).orElseThrow(() -> ApiException.notFound("Destination warehouse not found"));
        }
        TransportManifest m = new TransportManifest();
        m.setId("mf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        m.setManifestNumber("MNF-" + System.currentTimeMillis());
        m.setOriginWarehouseId(originWarehouseId);
        m.setDestinationWarehouseId(destinationWarehouseId);
        m.setDriverId(driverId);
        m.setStatus(ManifestStatus.DRAFT);
        return manifestRepository.save(m);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String warehouseId, String scope) {
        List<TransportManifest> rows = switch (scope != null ? scope : "outbound") {
            case "inbound" -> manifestRepository.findByDestinationWarehouseIdOrderByCreatedAtDesc(warehouseId);
            case "in-transit" -> manifestRepository.findByStatusOrderByCreatedAtDesc(ManifestStatus.IN_TRANSIT);
            default -> manifestRepository.findByOriginWarehouseIdOrderByCreatedAtDesc(warehouseId);
        };
        return rows.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDetail(String manifestId) {
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        Map<String, Object> detail = new LinkedHashMap<>(toSummary(manifest));
        detail.put("parcels", listParcelDetails(manifestId));
        detail.put("unloadStatus", unloadStatus(manifestId));
        return detail;
    }

    @Transactional
    public ManifestParcel scanParcel(String manifestId, String packageId, String trackingNumber, String scannedByUserId) {
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        if (manifest.getStatus() != ManifestStatus.DRAFT && manifest.getStatus() != ManifestStatus.SEALED) {
            throw ApiException.badRequest("Cannot scan parcels onto manifest in status " + manifest.getStatus());
        }
        et.guzo.domain.entity.Package pkg = resolvePackage(packageId, trackingNumber);
        if (!manifest.getOriginWarehouseId().equals(pkg.getWarehouseId())) {
            throw ApiException.badRequest("Parcel is not at the origin warehouse for this manifest");
        }
        WarehouseInventory inv = inventoryRepository.findByPackageId(pkg.getId())
            .orElseThrow(() -> ApiException.badRequest("Parcel is not in warehouse inventory"));
        if (inv.getDispatchedAt() != null) {
            throw ApiException.badRequest("Parcel already dispatched from warehouse");
        }

        boolean exists = manifestParcelRepository.findByManifestId(manifestId).stream()
            .anyMatch(mp -> mp.getPackageId().equals(pkg.getId()));
        if (exists) throw ApiException.badRequest("Parcel already on manifest");

        ManifestParcel row = new ManifestParcel();
        row.setId("mp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        row.setManifestId(manifestId);
        row.setPackageId(pkg.getId());
        row.setScannedByUserId(scannedByUserId);
        if (manifest.getStatus() == ManifestStatus.DRAFT) {
            manifest.setStatus(ManifestStatus.SEALED);
            manifestRepository.save(manifest);
        }
        return manifestParcelRepository.save(row);
    }

    @Transactional
    public TransportManifest sealAndDepart(String manifestId, String sealNumber) {
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        List<ManifestParcel> parcels = manifestParcelRepository.findByManifestId(manifestId);
        if (parcels.isEmpty()) throw ApiException.badRequest("Manifest has no parcels");

        Instant now = Instant.now();
        for (ManifestParcel mp : parcels) {
            et.guzo.domain.entity.Package pkg = packageRepository.findById(mp.getPackageId())
                .orElseThrow(() -> ApiException.notFound("Package not found"));
            Order order = orderRepository.findById(pkg.getOrderId())
                .orElseThrow(() -> ApiException.notFound("Order not found"));

            pkg.setStatus(PackageStatus.IN_TRANSIT);
            pkg.setUpdatedAt(now);
            packageRepository.save(pkg);

            if (!List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED).contains(order.getStatus())) {
                order.setStatus(OrderStatus.IN_TRANSIT);
                order.setUpdatedAt(now);
                orderRepository.save(order);
            }

            inventoryRepository.findByPackageId(pkg.getId()).ifPresent(inv -> {
                inv.setDispatchedAt(now);
                inv.setUpdatedAt(now);
                inventoryRepository.save(inv);
            });

            trackingService.record(order.getId(), TrackingEventType.IN_TRANSIT, OrderStatus.IN_TRANSIT,
                "Departed on manifest " + manifest.getManifestNumber(), null);
            notifyCustomer(order, "In transit",
                "Your parcel " + order.getOrderNumber() + " departed on truck " + manifest.getManifestNumber());
        }

        manifest.setSealNumber(sealNumber);
        manifest.setStatus(ManifestStatus.IN_TRANSIT);
        manifest.setDepartedAt(now);
        return manifestRepository.save(manifest);
    }

    @Transactional
    public TransportManifest markArrived(String manifestId) {
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        if (manifest.getStatus() != ManifestStatus.IN_TRANSIT) {
            throw ApiException.badRequest("Manifest is not in transit");
        }
        manifest.setStatus(ManifestStatus.ARRIVED);
        manifest.setArrivedAt(Instant.now());
        return manifestRepository.save(manifest);
    }

    @Transactional
    public Map<String, Object> unloadScan(String manifestId, String trackingNumber, AuthUser user) {
        TransportManifest manifest = manifestRepository.findById(manifestId)
            .orElseThrow(() -> ApiException.notFound("Manifest not found"));
        if (manifest.getStatus() != ManifestStatus.ARRIVED && manifest.getStatus() != ManifestStatus.IN_TRANSIT) {
            throw ApiException.badRequest("Manifest is not ready for unload");
        }
        if (manifest.getStatus() == ManifestStatus.IN_TRANSIT) {
            manifest.setStatus(ManifestStatus.ARRIVED);
            manifest.setArrivedAt(Instant.now());
            manifestRepository.save(manifest);
        }

        et.guzo.domain.entity.Package pkg = resolvePackage(null, trackingNumber);
        ManifestParcel mp = manifestParcelRepository.findByManifestId(manifestId).stream()
            .filter(row -> row.getPackageId().equals(pkg.getId()))
            .findFirst()
            .orElseThrow(() -> ApiException.badRequest("Parcel not on this manifest"));

        if (mp.getUnloadedAt() == null) {
            mp.setUnloadedAt(Instant.now());
            manifestParcelRepository.save(mp);
        }

        String destWarehouseId = manifest.getDestinationWarehouseId();
        if (destWarehouseId != null && !destWarehouseId.isBlank()) {
            Map<String, String> receiveInput = new HashMap<>();
            receiveInput.put("trackingNumber", pkg.getTrackingNumber());
            receiveInput.put("note", "Unloaded from manifest " + manifest.getManifestNumber());
            warehouseOpsService.receive(destWarehouseId, receiveInput);
        }

        Map<String, Object> status = unloadStatus(manifestId);
        if (Boolean.TRUE.equals(status.get("complete"))) {
            manifest.setStatus(ManifestStatus.UNLOADED);
            manifestRepository.save(manifest);
        }
        status.put("scannedTracking", pkg.getTrackingNumber());
        return status;
    }

    @Transactional(readOnly = true)
    public List<ManifestParcel> listParcels(String manifestId) {
        return manifestParcelRepository.findByManifestId(manifestId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listParcelDetails(String manifestId) {
        return manifestParcelRepository.findByManifestId(manifestId).stream().map(mp -> {
            et.guzo.domain.entity.Package pkg = packageRepository.findById(mp.getPackageId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", mp.getId());
            row.put("packageId", mp.getPackageId());
            row.put("scannedAt", mp.getScannedAt());
            row.put("unloadedAt", mp.getUnloadedAt());
            if (pkg != null) {
                row.put("trackingNumber", pkg.getTrackingNumber());
                row.put("status", pkg.getStatus().name());
            }
            return row;
        }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> unloadStatus(String manifestId) {
        List<ManifestParcel> parcels = manifestParcelRepository.findByManifestId(manifestId);
        long unloaded = parcels.stream().filter(p -> p.getUnloadedAt() != null).count();
        List<String> missing = parcels.stream()
            .filter(p -> p.getUnloadedAt() == null)
            .map(p -> packageRepository.findById(p.getPackageId()).map(et.guzo.domain.entity.Package::getTrackingNumber).orElse(p.getPackageId()))
            .toList();
        boolean complete = !parcels.isEmpty() && unloaded == parcels.size();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("expected", parcels.size());
        result.put("unloaded", unloaded);
        result.put("missing", missing);
        result.put("complete", complete);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> liveTrucks() {
        return manifestRepository.findByStatusOrderByCreatedAtDesc(ManifestStatus.IN_TRANSIT).stream()
            .map(m -> {
                Map<String, Object> row = new LinkedHashMap<>(toSummary(m));
                row.put("parcelCount", manifestParcelRepository.findByManifestId(m.getId()).size());
                return row;
            }).toList();
    }

    private et.guzo.domain.entity.Package resolvePackage(String packageId, String trackingNumber) {
        if (packageId != null && !packageId.isBlank()) {
            return packageRepository.findById(packageId)
                .orElseThrow(() -> ApiException.notFound("Package not found"));
        }
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw ApiException.badRequest("packageId or trackingNumber is required");
        }
        return packageRepository.findByTrackingNumber(trackingNumber.trim())
            .orElseThrow(() -> ApiException.notFound("No parcel found for that tracking number"));
    }

    private void notifyCustomer(Order order, String title, String body) {
        customerRepository.findById(order.getCustomerId()).ifPresent(customer ->
            notificationService.notify(customer.getUserId(), "ORDER_STATUS", title, body));
    }

    private Map<String, Object> toSummary(TransportManifest m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("manifestNumber", m.getManifestNumber());
        map.put("status", m.getStatus().name());
        map.put("sealNumber", m.getSealNumber());
        map.put("originWarehouseId", m.getOriginWarehouseId());
        map.put("destinationWarehouseId", m.getDestinationWarehouseId());
        map.put("driverId", m.getDriverId());
        map.put("departedAt", m.getDepartedAt());
        map.put("arrivedAt", m.getArrivedAt());
        map.put("createdAt", m.getCreatedAt());
        return map;
    }
}
