package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.*;
import et.guzo.repository.*;
import et.guzo.security.AuthUser;
import et.guzo.security.RoleChecker;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final DashboardService dashboardService;
    private final AuditLogRepository auditLogRepository;
    private final ActivityLogService activityLogService;
    private final OrderRepository orderRepository;
    private final PackageRepository packageRepository;
    private final DeliveryRepository deliveryRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> summary() {
        return dashboardService.adminSummary();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> auditLogs(int page, int limit) {
        var result = auditLogRepository.findAll(PageQuery.of(page, limit));
        List<Map<String, Object>> items = result.getContent().stream().map(this::auditDto).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> activityLogs(int page, int limit) {
        return activityLogService.list(page, limit);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exceptions(int limit) {
        int take = Math.min(50, Math.max(1, limit));
        PageRequest page = PageRequest.of(0, take);

        List<Order> failedOrders = orderRepository.findByStatusInOrderByUpdatedAtDesc(
            List.of(OrderStatus.FAILED, OrderStatus.RETURNED), page);
        List<et.guzo.domain.entity.Package> lostPackages = packageRepository.findByStatusOrderByUpdatedAtDesc(PackageStatus.LOST, page);
        List<et.guzo.domain.entity.Package> exceptionPackages = packageRepository.findByStatusInOrderByUpdatedAtDesc(
            List.of(PackageStatus.DAMAGED, PackageStatus.RETURNED), page);
        List<Delivery> failedDeliveries = deliveryRepository.findByFailedAtIsNotNullOrderByFailedAtDesc(page);
        List<SupportTicket> urgentTickets = supportTicketRepository.findByStatusInAndPriorityInOrderByCreatedAtDesc(
            List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS),
            List.of(TicketPriority.HIGH, TicketPriority.URGENT), page);

        List<Map<String, Object>> failedDeliveryDtos = failedDeliveries.stream().map(d -> {
            Order order = orderRepository.findById(d.getOrderId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", d.getId());
            row.put("failureReason", d.getFailureReason());
            row.put("failedAt", d.getFailedAt());
            row.put("orderNumber", order != null ? order.getOrderNumber() : null);
            return row;
        }).toList();

        return Map.of(
            "failedOrders", failedOrders.stream().map(this::orderBrief).toList(),
            "lostPackages", lostPackages.stream().map(this::packageBrief).toList(),
            "exceptionPackages", exceptionPackages.stream().map(this::packageBrief).toList(),
            "failedDeliveries", failedDeliveryDtos,
            "urgentTickets", urgentTickets.stream().map(this::ticketBrief).toList(),
            "totals", Map.of(
                "failedOrders", failedOrders.size(),
                "lostPackages", lostPackages.size(),
                "exceptionPackages", exceptionPackages.size(),
                "failedDeliveries", failedDeliveries.size(),
                "urgentTickets", urgentTickets.size()
            )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> paymentReconciliation() {
        List<Map<String, Object>> byStatus = paymentRepository.groupByStatus().stream().map(r -> Map.<String, Object>of(
            "status", r[0].toString(),
            "count", r[1],
            "amount", r[2],
            "refunded", r[3]
        )).toList();

        return Map.of(
            "byStatus", byStatus,
            "anomalies", Map.of(
                "pendingPaymentOrders", orderRepository.countByStatus(OrderStatus.PENDING_PAYMENT),
                "paidBeforeDelivery", paymentRepository.countPaidBeforeDelivery(),
                "deliveredUnpaid", paymentRepository.countDeliveredUnpaid()
            )
        );
    }

    @Transactional
    public Map<String, Object> approveDriver(String driverId, AuthUser actor) {
        RoleChecker.requireAdmin(actor);
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> ApiException.notFound("Driver not found"));
        driver.setApprovalStatus(DriverApprovalStatus.APPROVED);
        driver.setAvailable(true);
        driver.setUpdatedAt(Instant.now());
        driverRepository.save(driver);
        return toDriverDto(driver);
    }

    @Transactional
    public Map<String, Object> rejectDriver(String driverId, AuthUser actor) {
        RoleChecker.requireAdmin(actor);
        Driver driver = driverRepository.findById(driverId).orElseThrow(() -> ApiException.notFound("Driver not found"));
        driver.setApprovalStatus(DriverApprovalStatus.REJECTED);
        driver.setAvailable(false);
        driver.setUpdatedAt(Instant.now());
        driverRepository.save(driver);
        return toDriverDto(driver);
    }

    private Map<String, Object> auditDto(AuditLog log) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", log.getId());
        dto.put("actorId", log.getActorId());
        dto.put("action", log.getAction());
        dto.put("entityType", log.getEntityType());
        dto.put("entityId", log.getEntityId());
        dto.put("before", log.getBefore());
        dto.put("after", log.getAfter());
        dto.put("createdAt", log.getCreatedAt());
        if (log.getActorId() != null) {
            userRepository.findById(log.getActorId()).ifPresent(u -> dto.put("actor", Map.of(
                "id", u.getId(), "email", u.getEmail(), "firstName", u.getFirstName(), "lastName", u.getLastName()
            )));
        }
        return dto;
    }

    private Map<String, Object> orderBrief(Order o) {
        return Map.of("id", o.getId(), "orderNumber", o.getOrderNumber(), "status", o.getStatus().name(), "updatedAt", o.getUpdatedAt());
    }

    private Map<String, Object> packageBrief(et.guzo.domain.entity.Package p) {
        return Map.of("id", p.getId(), "trackingNumber", p.getTrackingNumber(), "status", p.getStatus().name(), "updatedAt", p.getUpdatedAt());
    }

    private Map<String, Object> ticketBrief(SupportTicket t) {
        return Map.of("id", t.getId(), "ticketNumber", t.getTicketNumber(), "subject", t.getSubject(),
            "status", t.getStatus().name(), "priority", t.getPriority().name(), "createdAt", t.getCreatedAt());
    }

    public Map<String, Object> toDriverDto(Driver d) {
        var u = userRepository.findById(d.getUserId()).orElse(null);
        return Map.of(
            "id", d.getId(), "driverCode", d.getDriverCode(),
            "approvalStatus", d.getApprovalStatus().name(),
            "isAvailable", d.isAvailable(), "rating", d.getRating(),
            "totalDeliveries", d.getTotalDeliveries(), "createdAt", d.getCreatedAt(),
            "user", u == null ? null : Map.of(
                "id", u.getId(), "firstName", u.getFirstName(), "lastName", u.getLastName(),
                "phone", u.getPhone(), "email", u.getEmail()
            )
        );
    }
}
