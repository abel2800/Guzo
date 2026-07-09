package et.guzo.service;

import et.guzo.domain.entity.Order;
import et.guzo.domain.enums.*;
import et.guzo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final MerchantRepository merchantRepository;
    private final CustomerRepository customerRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final PackageRepository packageRepository;
    private final InvoiceRepository invoiceRepository;
    private final BranchOpsService branchOpsService;
    private final TransportManifestRepository transportManifestRepository;
    private final BranchRepository branchRepository;

    private static List<Map<String, Object>> statusRows(List<Object[]> rows) {
        return rows.stream().map(r -> Map.<String, Object>of("status", r[0].toString(), "count", r[1])).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminSummary() {
        Instant now = Instant.now();
        Instant sevenDaysAgo = now.minus(7, ChronoUnit.DAYS);
        Instant fourteenDaysAgo = now.minus(14, ChronoUnit.DAYS);

        BigDecimal revenue = paymentRepository.sumGrossRevenue();
        long ordersLast7d = orderRepository.countByCreatedAtAfter(sevenDaysAgo);
        long ordersPrev7d = orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(fourteenDaysAgo, sevenDaysAgo);
        BigDecimal revenueLast7d = paymentRepository.sumPaidRevenueSince(sevenDaysAgo);
        BigDecimal revenuePrev7d = paymentRepository.sumPaidRevenueBetween(fourteenDaysAgo, sevenDaysAgo);
        if (revenueLast7d == null) revenueLast7d = BigDecimal.ZERO;
        if (revenuePrev7d == null) revenuePrev7d = BigDecimal.ZERO;

        double orderGrowthPct = ordersPrev7d > 0
            ? ((ordersLast7d - ordersPrev7d) * 100.0 / ordersPrev7d)
            : (ordersLast7d > 0 ? 100.0 : 0.0);
        double revenueGrowthPct = revenuePrev7d.compareTo(BigDecimal.ZERO) > 0
            ? (revenueLast7d.subtract(revenuePrev7d).multiply(BigDecimal.valueOf(100))
                .divide(revenuePrev7d, 1, java.math.RoundingMode.HALF_UP)).doubleValue()
            : (revenueLast7d.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0);

        return Map.of(
            "totals", Map.of(
                "users", userRepository.count(),
                "orders", orderRepository.count(),
                "approvedDrivers", driverRepository.countByApprovalStatus(DriverApprovalStatus.APPROVED),
                "activeDeliveries", deliveryRepository.countByDeliveredAtIsNullAndDriverIdIsNotNull(),
                "pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING_PAYMENT),
                "revenue", revenue != null ? revenue : BigDecimal.ZERO,
                "warehouses", warehouseRepository.countByActiveTrue(),
                "branches", branchRepository.countByActiveTrue(),
                "merchants", merchantRepository.count()
            ),
            "growth", Map.of(
                "ordersLast7d", ordersLast7d,
                "ordersPrev7d", ordersPrev7d,
                "orderGrowthPct", Math.round(orderGrowthPct * 10.0) / 10.0,
                "revenueLast7d", revenueLast7d,
                "revenuePrev7d", revenuePrev7d,
                "revenueGrowthPct", Math.round(revenueGrowthPct * 10.0) / 10.0
            ),
            "ordersByStatus", statusRows(orderRepository.countGroupByStatus())
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> merchantSummary(String userId) {
        var merchant = merchantRepository.findByUserId(userId).orElse(null);
        if (merchant == null) return Map.of();
        String mid = merchant.getId();
        List<OrderStatus> inTransit = List.of(OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY);
        return Map.of(
            "merchantCode", merchant.getMerchantCode(),
            "businessName", merchant.getBusinessName(),
            "totals", Map.of(
                "orders", orderRepository.countByMerchantId(mid),
                "delivered", orderRepository.countByMerchantIdAndStatus(mid, OrderStatus.DELIVERED),
                "inTransit", orderRepository.countByMerchantIdAndStatusIn(mid, inTransit),
                "pendingPayment", orderRepository.countByMerchantIdAndStatus(mid, OrderStatus.PENDING_PAYMENT),
                "revenue", orderRepository.sumRevenueByMerchant(mid)
            ),
            "ordersByStatus", statusRows(orderRepository.countGroupByStatusForMerchant(mid))
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> customerSummary(String userId) {
        var customer = customerRepository.findByUserId(userId).orElse(null);
        if (customer == null) {
            return Map.of(
                "totals", Map.of("orders", 0, "inTransit", 0, "delivered", 0, "openTickets", 0),
                "parcels", Map.of("active", 0, "incoming", 0, "readyForPickup", 0, "delivered", 0, "draft", 0),
                "ordersByStatus", List.of(),
                "recentOrders", List.of()
            );
        }
        String cid = customer.getId();
        var user = userRepository.findById(userId).orElse(null);
        String guzoId = user != null ? user.getGuzoId() : null;
        String phone = user != null ? user.getPhone() : null;

        List<OrderStatus> inTransit = List.of(
            OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY, OrderStatus.AT_WAREHOUSE, OrderStatus.AT_BRANCH
        );
        List<OrderStatus> active = List.of(
            OrderStatus.CONFIRMED, OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT,
            OrderStatus.AT_BRANCH, OrderStatus.AT_WAREHOUSE, OrderStatus.AT_DESTINATION_BRANCH,
            OrderStatus.OUT_FOR_DELIVERY
        );
        List<OrderStatus> ready = List.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.AT_DESTINATION_BRANCH);
        List<OrderStatus> draft = List.of(OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT);

        long openTickets = supportTicketRepository.countByRequesterIdAndStatusIn(userId,
            List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER));
        long incoming = orderRepository.countIncomingForReceiver(cid, guzoId, phone);

        List<Map<String, Object>> recentOrders = orderRepository
            .findByCustomerId(cid, PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "createdAt")))
            .stream()
            .map(o -> Map.<String, Object>of(
                "id", o.getId(),
                "orderNumber", o.getOrderNumber(),
                "status", o.getStatus().name(),
                "createdAt", o.getCreatedAt().toString()
            ))
            .toList();

        return Map.of(
            "totals", Map.of(
                "orders", orderRepository.countByCustomerId(cid),
                "delivered", orderRepository.countByCustomerIdAndStatus(cid, OrderStatus.DELIVERED),
                "inTransit", orderRepository.countByCustomerIdAndStatusIn(cid, inTransit),
                "openTickets", openTickets
            ),
            "parcels", Map.of(
                "active", orderRepository.countByCustomerIdAndStatusIn(cid, active),
                "incoming", incoming,
                "readyForPickup", orderRepository.countByCustomerIdAndStatusIn(cid, ready),
                "delivered", orderRepository.countByCustomerIdAndStatus(cid, OrderStatus.DELIVERED),
                "draft", orderRepository.countByCustomerIdAndStatusIn(cid, draft)
            ),
            "ordersByStatus", statusRows(orderRepository.countGroupByStatusForCustomer(cid)),
            "recentOrders", recentOrders
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> driverSummary(String userId) {
        var driver = driverRepository.findByUserId(userId).orElse(null);
        if (driver == null) return Map.of();
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long todayPickups = orderRepository.countDriverPickupsSince(driver.getId(), startOfDay);
        long todayDeliveries = deliveryRepository.countByDriverIdAndDeliveredAtAfter(driver.getId(), startOfDay);
        long intercity = transportManifestRepository.countByDriverIdAndStatusIn(
            driver.getId(), List.of(ManifestStatus.DRAFT, ManifestStatus.SEALED, ManifestStatus.IN_TRANSIT));
        long available = deliveryRepository.findAvailableOrderIds().size();
        return Map.of(
            "driverCode", driver.getDriverCode(),
            "status", driver.isAvailable() ? "AVAILABLE" : "OFFLINE",
            "isAvailable", driver.isAvailable(),
            "earningsBalance", driver.getEarningsBalance(),
            "rating", driver.getRating(),
            "activeDeliveries", deliveryRepository.countByDriverIdAndDeliveredAtIsNull(driver.getId()),
            "completedDeliveries", deliveryRepository.countByDriverIdAndDeliveredAtIsNotNull(driver.getId()),
            "today", Map.of(
                "pickups", todayPickups,
                "deliveries", todayDeliveries,
                "intercity", intercity,
                "available", available
            )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> warehouseSummary() {
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        return Map.of(
            "totals", Map.of(
                "warehouses", warehouseRepository.countByActiveTrue(),
                "inStock", warehouseInventoryRepository.countByDispatchedAtIsNull(),
                "receivedToday", warehouseInventoryRepository.countByReceivedAtAfter(startOfDay),
                "dispatchedToday", warehouseInventoryRepository.countByDispatchedAtAfter(startOfDay)
            ),
            "packagesByStatus", statusRows(packageRepository.countGroupByStatus())
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> financeSummary() {
        BigDecimal gross = paymentRepository.sumGrossRevenue();
        BigDecimal refunded = paymentRepository.sumRefunded();
        long outstanding = invoiceRepository.countByStatusIn(List.of(InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE));
        BigDecimal outstandingAmt = invoiceRepository.sumOutstanding();
        return Map.of(
            "totals", Map.of(
                "grossRevenue", gross != null ? gross : BigDecimal.ZERO,
                "refunded", refunded != null ? refunded : BigDecimal.ZERO,
                "netRevenue", gross != null && refunded != null ? gross.subtract(refunded) : BigDecimal.ZERO,
                "paidCount", paymentRepository.countByStatus(PaymentStatus.PAID),
                "pendingCount", paymentRepository.countByStatusIn(List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING)),
                "refundedCount", paymentRepository.countByStatusIn(List.of(PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED)),
                "outstandingInvoices", outstanding,
                "outstandingAmount", outstandingAmt != null ? outstandingAmt : BigDecimal.ZERO
            ),
            "paymentsByStatus", List.of()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> supportSummary() {
        long open = supportTicketRepository.countByStatus(TicketStatus.OPEN);
        long inProgress = supportTicketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long waiting = supportTicketRepository.countByStatus(TicketStatus.WAITING_CUSTOMER);
        return Map.of(
            "totals", Map.of("open", open, "inProgress", inProgress, "waiting", waiting, "resolvedToday", 0L, "total", open + inProgress + waiting),
            "ticketsByStatus", List.of()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> branchSummary(String branchId, et.guzo.security.AuthUser user) {
        return branchOpsService.stats(branchId, user);
    }
}
