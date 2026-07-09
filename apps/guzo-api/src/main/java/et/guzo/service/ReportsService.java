package et.guzo.service;

import et.guzo.repository.DeliveryRepository;
import et.guzo.repository.OrderRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final EntityManager entityManager;

    private Instant[] range(String from, String to) {
        Instant gte = from != null ? Instant.parse(from) : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant lte = to != null ? Instant.parse(to) : Instant.now();
        return new Instant[]{gte, lte};
    }

    @Transactional(readOnly = true)
    public Map<String, Object> ordersReport(String from, String to) {
        Instant[] r = range(from, to);
        long count = entityManager.createQuery("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to", Long.class)
            .setParameter("from", r[0]).setParameter("to", r[1]).getSingleResult();
        Object revenue = entityManager.createQuery("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to", Object.class)
            .setParameter("from", r[0]).setParameter("to", r[1]).getSingleResult();
        List<Object[]> byStatus = entityManager.createQuery(
            "SELECT o.status, COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to GROUP BY o.status", Object[].class)
            .setParameter("from", r[0]).setParameter("to", r[1]).getResultList();
        return Map.of(
            "range", Map.of("gte", r[0], "lte", r[1]),
            "totalOrders", count,
            "totalRevenue", revenue,
            "byStatus", byStatus.stream().map(row -> Map.of("status", row[0].toString(), "count", row[1])).toList()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> deliveriesReport(String from, String to) {
        Instant[] r = range(from, to);
        long delivered = entityManager.createQuery(
            "SELECT COUNT(d) FROM Delivery d WHERE d.createdAt BETWEEN :from AND :to AND d.deliveredAt IS NOT NULL", Long.class)
            .setParameter("from", r[0]).setParameter("to", r[1]).getSingleResult();
        return Map.of(
            "range", Map.of("gte", r[0], "lte", r[1]),
            "delivered", delivered,
            "failed", 0L,
            "total", delivered
        );
    }
}
