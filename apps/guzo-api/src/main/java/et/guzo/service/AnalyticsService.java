package et.guzo.service;

import et.guzo.domain.entity.Driver;
import et.guzo.domain.entity.User;
import et.guzo.repository.DriverRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.repository.PackageRepository;
import et.guzo.repository.UserRepository;
import et.guzo.repository.DeliveryRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EntityManager entityManager;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final DeliveryRepository deliveryRepository;
    private final PackageRepository packageRepository;

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> ordersOverTime(int days) {
        List<Object[]> rows = entityManager.createNativeQuery("""
            SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
            FROM orders
            WHERE "createdAt" >= NOW() - (:days || ' days')::interval
            GROUP BY day ORDER BY day ASC
            """).setParameter("days", String.valueOf(days)).getResultList();
        return rows.stream().map(r -> Map.<String, Object>of("day", r[0], "count", ((Number) r[1]).longValue())).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> revenueByType() {
        return entityManager.createQuery("""
            SELECT o.deliveryType, COALESCE(SUM(o.totalAmount), 0), COUNT(o)
            FROM Order o GROUP BY o.deliveryType
            """, Object[].class).getResultStream()
            .map(r -> Map.<String, Object>of(
                "deliveryType", r[0].toString(),
                "revenue", r[1],
                "orders", r[2]
            )).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> topDrivers(int limit) {
        return driverRepository.findAll().stream()
            .sorted((a, b) -> Integer.compare(b.getTotalDeliveries(), a.getTotalDeliveries()))
            .limit(limit)
            .map(d -> {
                User u = userRepository.findById(d.getUserId()).orElse(null);
                return Map.<String, Object>of(
                    "driverCode", d.getDriverCode(),
                    "name", u == null ? d.getDriverCode() : u.getFirstName() + " " + u.getLastName(),
                    "totalDeliveries", d.getTotalDeliveries(),
                    "rating", d.getRating() != null ? d.getRating() : BigDecimal.ZERO
                );
            }).toList();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Map<String, Object> operationsMetrics(int days) {
        Instant since = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        long delivered = deliveryRepository.countByDeliveredAtAfter(since);
        long failedDeliveries = deliveryRepository.countByFailedAtAfter(since);
        long lostPackages = packageRepository.findByStatusOrderByUpdatedAtDesc(
            et.guzo.domain.enums.PackageStatus.LOST, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)
        ).stream().filter(p -> p.getUpdatedAt() != null && p.getUpdatedAt().isAfter(since)).count();

        @SuppressWarnings("unchecked")
        List<Number> lateRows = entityManager.createNativeQuery("""
            SELECT COUNT(*)::bigint FROM orders
            WHERE status = 'DELIVERED' AND "deliveredAt" >= :since
            AND "estimatedDeliveryAt" IS NOT NULL AND "deliveredAt" > "estimatedDeliveryAt"
            """).setParameter("since", since).getResultList();
        long lateDeliveries = lateRows.isEmpty() ? 0 : lateRows.get(0).longValue();

        @SuppressWarnings("unchecked")
        List<Number> avgRows = entityManager.createNativeQuery("""
            SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "createdAt")) / 3600) AS avg_hours
            FROM deliveries WHERE "deliveredAt" >= :since
            """).setParameter("since", since).getResultList();
        double avgHours = avgRows.isEmpty() || avgRows.get(0) == null ? 0
            : Math.round(avgRows.get(0).doubleValue() * 10.0) / 10.0;

        long totalAttempts = delivered + failedDeliveries;
        double latePct = delivered > 0 ? Math.round(lateDeliveries * 1000.0 / delivered) / 10.0 : 0;
        double failPct = totalAttempts > 0 ? Math.round(failedDeliveries * 1000.0 / totalAttempts) / 10.0 : 0;

        List<Object[]> branchRows = entityManager.createNativeQuery("""
            SELECT b.id AS branch_id, b.name AS branch_name, b.city,
                   COUNT(i.id)::bigint AS pickups,
                   AVG(b."queueLevel") AS avg_queue
            FROM guzo_branches b
            LEFT JOIN guzo_branch_inventory i ON i."branchId" = b.id AND i."pickedUpAt" >= :since
            WHERE b."isActive" = true
            GROUP BY b.id, b.name, b.city
            ORDER BY pickups DESC
            LIMIT 10
            """).setParameter("since", since).getResultList();

        List<Map<String, Object>> branchRankings = branchRows.stream().map(r -> Map.<String, Object>of(
            "branchId", r[0],
            "name", r[1],
            "city", r[2],
            "pickups", ((Number) r[3]).longValue(),
            "queueLevel", r[4] != null ? ((Number) r[4]).doubleValue() : 0
        )).toList();

        return Map.of(
            "rangeDays", days,
            "delivered", delivered,
            "failedDeliveries", failedDeliveries,
            "lostPackages", lostPackages,
            "lateDeliveries", lateDeliveries,
            "latePct", latePct,
            "failPct", failPct,
            "avgDeliveryHours", avgHours,
            "branchRankings", branchRankings
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> satisfactionSummary(int days) {
        Instant since = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        List<Object[]> agg = entityManager.createQuery("""
            SELECT AVG(r.rating), COUNT(r) FROM Review r WHERE r.createdAt >= :since
            """, Object[].class).setParameter("since", since).getResultList();

        double avgRating = 0;
        long totalReviews = 0;
        if (!agg.isEmpty() && agg.get(0)[0] != null) {
            avgRating = Math.round(((Number) agg.get(0)[0]).doubleValue() * 100.0) / 100.0;
            totalReviews = ((Number) agg.get(0)[1]).longValue();
        }

        List<Object[]> distribution = entityManager.createQuery("""
            SELECT r.rating, COUNT(r) FROM Review r WHERE r.createdAt >= :since GROUP BY r.rating ORDER BY r.rating ASC
            """, Object[].class).setParameter("since", since).getResultList();

        List<Map<String, Object>> dist = distribution.stream()
            .map(r -> Map.<String, Object>of("rating", r[0], "count", r[1])).toList();

        return Map.of(
            "rangeDays", days,
            "averageRating", avgRating,
            "totalReviews", totalReviews,
            "distribution", dist
        );
    }
}
