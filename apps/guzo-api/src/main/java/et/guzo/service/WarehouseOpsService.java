package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.PackageStatus;
import et.guzo.domain.enums.TrackingEventType;
import et.guzo.repository.*;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarehouseOpsService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final PackageRepository packageRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final TrackingService trackingService;

    @Transactional
    public Map<String, Object> receive(String warehouseId, Map<String, String> input) {
        ensureWarehouse(warehouseId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow(() -> ApiException.notFound("Order not found"));
        Instant now = Instant.now();
        String shelf = input.get("shelfCode");
        String zone = input.get("zone");
        if (shelf == null || shelf.isBlank()) {
            Address dropoff = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
            String city = dropoff != null ? dropoff.getCity() : "General";
            zone = shelfZoneForCity(city);
            long slot = inventoryRepository.countByWarehouseIdAndDispatchedAtIsNull(warehouseId) % 20 + 1;
            shelf = zone + "-" + String.format("%02d", slot);
        }
        pkg.setStatus(PackageStatus.IN_WAREHOUSE);
        pkg.setWarehouseId(warehouseId);
        pkg.setUpdatedAt(now);
        packageRepository.save(pkg);
        if (!List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED).contains(order.getStatus())) {
            order.setStatus(OrderStatus.AT_WAREHOUSE);
            order.setUpdatedAt(now);
            orderRepository.save(order);
        }
        trackingService.record(order.getId(), TrackingEventType.ARRIVED_AT_WAREHOUSE, OrderStatus.AT_WAREHOUSE,
            input.getOrDefault("note", "Received at warehouse"), null);
        WarehouseInventory inv = inventoryRepository.findByPackageId(pkg.getId()).orElseGet(() -> {
            WarehouseInventory row = new WarehouseInventory();
            row.setId(IdUtil.cuid());
            row.setPackageId(pkg.getId());
            row.setCreatedAt(now);
            return row;
        });
        inv.setWarehouseId(warehouseId);
        inv.setShelfCode(shelf);
        inv.setZone(zone);
        inv.setReceivedAt(now);
        inv.setDispatchedAt(null);
        inv.setUpdatedAt(now);
        return toInventoryDto(inventoryRepository.save(inv), pkg, order);
    }

    @Transactional
    public Map<String, Object> sort(String warehouseId, Map<String, String> input) {
        ensureWarehouse(warehouseId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        WarehouseInventory inv = inventoryRepository.findByPackageId(pkg.getId())
            .orElseThrow(() -> ApiException.badRequest("Parcel is not in warehouse inventory"));
        if (inv.getDispatchedAt() != null) throw ApiException.badRequest("Parcel already dispatched");
        Instant now = Instant.now();
        pkg.setStatus(PackageStatus.SORTED);
        pkg.setUpdatedAt(now);
        packageRepository.save(pkg);
        inv.setShelfCode(input.get("shelfCode"));
        inv.setZone(input.get("zone"));
        inv.setUpdatedAt(now);
        inventoryRepository.save(inv);
        trackingService.record(pkg.getOrderId(), TrackingEventType.SORTED, OrderStatus.AT_WAREHOUSE,
            "Assigned to shelf " + input.get("shelfCode"), null);
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow();
        return toInventoryDto(inv, pkg, order);
    }

    @Transactional
    public Map<String, Object> dispatch(String warehouseId, Map<String, String> input) {
        ensureWarehouse(warehouseId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        WarehouseInventory inv = inventoryRepository.findByPackageId(pkg.getId())
            .orElseThrow(() -> ApiException.badRequest("Parcel is not in warehouse inventory"));
        if (inv.getDispatchedAt() != null) throw ApiException.badRequest("Parcel already dispatched");
        Instant now = Instant.now();
        pkg.setStatus(PackageStatus.DISPATCHED);
        pkg.setUpdatedAt(now);
        packageRepository.save(pkg);
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow();
        if (!List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED).contains(order.getStatus())) {
            order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
            order.setUpdatedAt(now);
            orderRepository.save(order);
        }
        inv.setDispatchedAt(now);
        inv.setUpdatedAt(now);
        inventoryRepository.save(inv);
        trackingService.record(order.getId(), TrackingEventType.DISPATCHED, OrderStatus.OUT_FOR_DELIVERY,
            input.getOrDefault("note", "Dispatched from warehouse"), null);
        return toInventoryDto(inv, pkg, order);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listInventory(String warehouseId, int page, int limit, String state) {
        ensureWarehouse(warehouseId);
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "receivedAt"));
        Page<WarehouseInventory> result = switch (state != null ? state : "in-stock") {
            case "dispatched" -> inventoryRepository.findByWarehouseIdAndDispatchedAtIsNotNull(warehouseId, pageable);
            case "all" -> inventoryRepository.findByWarehouseId(warehouseId, pageable);
            default -> inventoryRepository.findByWarehouseIdAndDispatchedAtIsNull(warehouseId, pageable);
        };
        List<Map<String, Object>> items = result.getContent().stream().map(inv -> {
            et.guzo.domain.entity.Package pkg = packageRepository.findById(inv.getPackageId()).orElse(null);
            Order order = pkg != null ? orderRepository.findById(pkg.getOrderId()).orElse(null) : null;
            return toInventoryDto(inv, pkg, order);
        }).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> stats(String warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
            .orElseThrow(() -> ApiException.notFound("Warehouse not found"));
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long inStock = inventoryRepository.countByWarehouseIdAndDispatchedAtIsNull(warehouseId);
        long receivedToday = inventoryRepository.countByWarehouseIdAndReceivedAtAfter(warehouseId, startOfDay);
        long dispatchedToday = inventoryRepository.countByWarehouseIdAndDispatchedAtAfter(warehouseId, startOfDay);
        long distinctShelves = inventoryRepository.countDistinctShelvesInStock(warehouseId);
        int capacity = warehouse.getCapacity();
        double capacityPercent = capacity > 0 ? Math.min(100.0, inStock * 100.0 / capacity) : 0;
        double shelfUtilization = distinctShelves > 0 ? Math.min(100.0, inStock * 100.0 / (distinctShelves * 10.0)) : 0;
        List<Object[]> byStatus = packageRepository.countGroupByStatusForWarehouse(warehouseId);
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("inStock", inStock);
        totals.put("receivedToday", receivedToday);
        totals.put("dispatchedToday", dispatchedToday);
        totals.put("capacity", capacity);
        totals.put("capacityPercent", Math.round(capacityPercent * 10) / 10.0);
        totals.put("distinctShelves", distinctShelves);
        totals.put("shelfUtilization", Math.round(shelfUtilization * 10) / 10.0);
        return Map.of(
            "totals", totals,
            "packagesByStatus", byStatus.stream().map(r -> Map.of("status", r[0].toString(), "count", r[1])).toList()
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> inventoryByCity(String warehouseId) {
        ensureWarehouse(warehouseId);
        List<WarehouseInventory> rows = inventoryRepository.findInStock(warehouseId);
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        for (WarehouseInventory inv : rows) {
            et.guzo.domain.entity.Package pkg = packageRepository.findById(inv.getPackageId()).orElse(null);
            Order order = pkg != null ? orderRepository.findById(pkg.getOrderId()).orElse(null) : null;
            Address dropoff = order != null ? addressRepository.findById(order.getDropoffAddressId()).orElse(null) : null;
            String city = dropoff != null && dropoff.getCity() != null ? dropoff.getCity() : "Unknown";
            grouped.computeIfAbsent(city, k -> new ArrayList<>()).add(toInventoryDto(inv, pkg, order));
        }
        return grouped.entrySet().stream()
            .map(e -> Map.<String, Object>of("city", e.getKey(), "count", e.getValue().size(), "parcels", e.getValue()))
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> agingReport(String warehouseId) {
        ensureWarehouse(warehouseId);
        Instant now = Instant.now();
        List<WarehouseInventory> rows = inventoryRepository.findInStock(warehouseId);
        long under24h = 0, oneToThree = 0, threeToSeven = 0, overSeven = 0;
        List<Map<String, Object>> stale = new ArrayList<>();
        for (WarehouseInventory inv : rows) {
            long hours = ChronoUnit.HOURS.between(inv.getReceivedAt(), now);
            if (hours < 24) under24h++;
            else if (hours < 72) oneToThree++;
            else if (hours < 168) threeToSeven++;
            else {
                overSeven++;
                et.guzo.domain.entity.Package pkg = packageRepository.findById(inv.getPackageId()).orElse(null);
                if (pkg != null) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("trackingNumber", pkg.getTrackingNumber());
                    row.put("receivedAt", inv.getReceivedAt());
                    row.put("hoursInStock", hours);
                    row.put("shelfCode", inv.getShelfCode());
                    stale.add(row);
                }
            }
        }
        Map<String, Object> buckets = new LinkedHashMap<>();
        buckets.put("under24h", under24h);
        buckets.put("oneToThreeDays", oneToThree);
        buckets.put("threeToSevenDays", threeToSeven);
        buckets.put("overSevenDays", overSeven);
        return Map.of("buckets", buckets, "stale", stale);
    }

    @Transactional
    public Map<String, Object> transfer(String fromWarehouseId, Map<String, String> input) {
        String toWarehouseId = input.get("destinationWarehouseId");
        if (toWarehouseId == null || toWarehouseId.isBlank()) {
            throw ApiException.badRequest("destinationWarehouseId is required");
        }
        ensureWarehouse(fromWarehouseId);
        ensureWarehouse(toWarehouseId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        WarehouseInventory inv = inventoryRepository.findByPackageId(pkg.getId())
            .orElseThrow(() -> ApiException.badRequest("Parcel is not in warehouse inventory"));
        if (!fromWarehouseId.equals(inv.getWarehouseId())) {
            throw ApiException.badRequest("Parcel is not at the source warehouse");
        }
        if (inv.getDispatchedAt() != null) throw ApiException.badRequest("Parcel already dispatched");
        Instant now = Instant.now();
        inv.setDispatchedAt(now);
        inv.setUpdatedAt(now);
        inventoryRepository.save(inv);
        Map<String, String> receiveInput = new LinkedHashMap<>();
        receiveInput.put("trackingNumber", pkg.getTrackingNumber());
        receiveInput.put("note", "Cross-warehouse transfer from " + fromWarehouseId);
        return receive(toWarehouseId, receiveInput);
    }

    private String shelfZoneForCity(String city) {
        if (city == null) return "Z";
        String c = city.trim().toLowerCase();
        if (c.contains("addis")) return "A";
        if (c.contains("hawassa")) return "H";
        if (c.contains("adama") || c.contains("nazret")) return "AD";
        if (c.contains("bahir")) return "BD";
        if (c.contains("dire")) return "DD";
        if (c.contains("mekelle")) return "M";
        if (c.contains("gondar")) return "G";
        return c.length() >= 2 ? c.substring(0, 2).toUpperCase() : "Z";
    }

    private void ensureWarehouse(String id) {
        warehouseRepository.findById(id).orElseThrow(() -> ApiException.notFound("Warehouse not found"));
    }

    private et.guzo.domain.entity.Package findPackage(String trackingNumber) {
        return packageRepository.findByTrackingNumber(trackingNumber.trim())
            .orElseThrow(() -> ApiException.notFound("No parcel found for that tracking number"));
    }

    private Map<String, Object> toInventoryDto(WarehouseInventory inv, et.guzo.domain.entity.Package pkg, Order order) {
        Warehouse wh = warehouseRepository.findById(inv.getWarehouseId()).orElse(null);
        Address dropoff = order != null ? addressRepository.findById(order.getDropoffAddressId()).orElse(null) : null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", inv.getId());
        map.put("shelfCode", inv.getShelfCode());
        map.put("zone", inv.getZone());
        map.put("receivedAt", inv.getReceivedAt());
        map.put("dispatchedAt", inv.getDispatchedAt());
        if (wh != null) map.put("warehouse", Map.of("id", wh.getId(), "code", wh.getCode(), "name", wh.getName()));
        else map.put("warehouse", null);
        if (pkg != null) {
            Map<String, Object> pkgMap = new LinkedHashMap<>();
            pkgMap.put("id", pkg.getId());
            pkgMap.put("trackingNumber", pkg.getTrackingNumber());
            pkgMap.put("status", pkg.getStatus().name());
            pkgMap.put("description", pkg.getDescription());
            pkgMap.put("weightKg", pkg.getWeightKg());
            if (order != null) {
                Map<String, Object> orderMap = new LinkedHashMap<>();
                orderMap.put("id", order.getId());
                orderMap.put("orderNumber", order.getOrderNumber());
                orderMap.put("status", order.getStatus().name());
                if (dropoff != null) {
                    orderMap.put("dropoffAddress", Map.of(
                        "city", dropoff.getCity(), "line1", dropoff.getLine1(), "contactName", dropoff.getContactName()
                    ));
                } else orderMap.put("dropoffAddress", null);
                pkgMap.put("order", orderMap);
            } else pkgMap.put("order", null);
            map.put("package", pkgMap);
        } else map.put("package", null);
        return map;
    }
}
