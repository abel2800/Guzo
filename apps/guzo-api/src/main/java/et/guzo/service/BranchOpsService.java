package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.*;
import et.guzo.repository.*;
import et.guzo.security.AuthUser;
import et.guzo.security.RoleChecker;
import et.guzo.util.IdUtil;
import et.guzo.web.dto.AddressInput;
import et.guzo.web.dto.BranchRegisterRequest;
import et.guzo.web.dto.OrderCreateRequest;
import et.guzo.web.dto.OrderDetailDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BranchOpsService {

    private final BranchRepository branchRepository;
    private final BranchInventoryRepository inventoryRepository;
    private final BranchStaffRepository branchStaffRepository;
    private final PackageRepository packageRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
    private final TrackingService trackingService;
    private final OrderStateMachine orderStateMachine;
    private final PickupCodeService pickupCodeService;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;

    public void assertBranchAccess(AuthUser user, String branchId) {
        ensureBranch(branchId);
        if (RoleChecker.isAdmin(user)) return;
        if (!RoleChecker.hasAnyRole(user, "BRANCH_STAFF")) {
            throw ApiException.forbidden("Branch staff access required");
        }
        boolean assigned = branchStaffRepository.findByUserId(user.getId()).stream()
            .anyMatch(s -> branchId.equals(s.getBranchId()));
        if (!assigned) throw ApiException.forbidden("You are not assigned to this branch");
    }

    @Transactional
    public Map<String, Object> receive(String branchId, Map<String, String> input, AuthUser user) {
        assertBranchAccess(user, branchId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        Order order = orderRepository.findById(pkg.getOrderId())
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        Instant now = Instant.now();
        OrderStatus next = resolveReceiveStatus(order, branchId);
        if (!List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED).contains(order.getStatus())) {
            orderStateMachine.assertTransition(order.getStatus(), next);
            order.setStatus(next);
            order.setUpdatedAt(now);
            orderRepository.save(order);
        }
        if (next == OrderStatus.AT_DESTINATION_BRANCH) {
            orderStateMachine.assertTransition(order.getStatus(), OrderStatus.READY_FOR_PICKUP);
            order.setStatus(OrderStatus.READY_FOR_PICKUP);
            order.setUpdatedAt(now);
            orderRepository.save(order);
        }
        applyPackageIntake(pkg, input);
        pkg.setStatus(next == OrderStatus.AT_BRANCH || next == OrderStatus.AT_DESTINATION_BRANCH
            ? PackageStatus.AT_BRANCH : PackageStatus.IN_TRANSIT);
        pkg.setUpdatedAt(now);
        packageRepository.save(pkg);
        trackingService.record(order.getId(), TrackingEventType.ARRIVED_AT_BRANCH, order.getStatus(),
            input.getOrDefault("note", "Received at branch"), user.getId());
        notifyStatus(order, order.getStatus());

        BranchInventory inv = inventoryRepository.findByPackageId(pkg.getId()).orElseGet(() -> {
            BranchInventory row = new BranchInventory();
            row.setId(IdUtil.cuid());
            row.setPackageId(pkg.getId());
            row.setCreatedAt(now);
            return row;
        });
        inv.setBranchId(branchId);
        inv.setShelfCode(input.get("shelfCode"));
        inv.setZone(input.get("zone"));
        inv.setMeasuredWeightKg(parseWeight(input.get("weightKg")));
        inv.setReceivedAt(now);
        inv.setPickedUpAt(null);
        inv.setUpdatedAt(now);
        return toInventoryDto(inventoryRepository.save(inv), pkg, order);
    }

    @Transactional
    public Map<String, Object> receiveIntake(String branchId, Map<String, String> input, MultipartFile photo, AuthUser user) {
        Map<String, Object> result = receive(branchId, input, user);
        if (photo == null || photo.isEmpty()) return result;
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        StoredFile file = fileStorageService.store(photo, user.getId(), FileCategory.PARCEL_INTAKE);
        BranchInventory inv = inventoryRepository.findByPackageId(pkg.getId()).orElse(null);
        if (inv != null) {
            inv.setPhotoFileId(file.getId());
            inv.setUpdatedAt(Instant.now());
            inventoryRepository.save(inv);
            Order order = orderRepository.findById(pkg.getOrderId()).orElse(null);
            result = toInventoryDto(inv, pkg, order);
            result.put("photoUrl", fileStorageService.publicUrl(file.getStorageKey()));
        }
        return result;
    }

    @Transactional
    public Map<String, Object> registerParcel(String branchId, BranchRegisterRequest req, AuthUser staff) {
        assertBranchAccess(staff, branchId);
        Branch branch = branchRepository.findById(branchId).orElseThrow(() -> ApiException.notFound("Branch not found"));
        if (req.senderPhone() == null || req.senderPhone().isBlank()) {
            throw ApiException.badRequest("Sender phone is required");
        }
        User sender = userRepository.findByPhone(req.senderPhone().trim())
            .orElseThrow(() -> ApiException.badRequest("Sender must have a GUZO account with this phone number"));
        Customer customer = customerRepository.findByUserId(sender.getId())
            .orElseThrow(() -> ApiException.badRequest("Sender is not registered as a customer"));

        OrderCreateRequest dto = new OrderCreateRequest();
        dto.setPickup(new AddressInput(
            branch.getLine1(), null, branch.getCity(), branch.getState(), branch.getCountry(), null,
            branch.getLatitude(), branch.getLongitude(), req.senderName(), req.senderPhone()
        ));
        String dropLine = req.dropoffLine1() != null && !req.dropoffLine1().isBlank() ? req.dropoffLine1() : req.dropoffCity();
        dto.setDropoff(new AddressInput(
            dropLine, null, req.dropoffCity(), null, "ET", null, null, null, req.receiverName(), req.receiverPhone()
        ));
        dto.setPickupMethod(PickupMethod.DROP_AT_BRANCH);
        dto.setOriginBranchId(branchId);
        dto.setDestinationBranchId(req.destinationBranchId());
        dto.setReceiverPhone(req.receiverPhone());
        dto.setReceiverGuzoId(req.receiverGuzoId());
        BigDecimal weight = req.weightKg() != null ? req.weightKg() : BigDecimal.ONE;
        dto.setWeightKg(weight);
        OrderCreateRequest.PackageInput pkgInput = new OrderCreateRequest.PackageInput();
        pkgInput.setDescription(req.description());
        pkgInput.setWeightKg(weight);
        pkgInput.setIsFragile(Boolean.TRUE.equals(req.fragile()));
        dto.setPackageInput(pkgInput);
        PaymentMethod method = PaymentMethod.CASH_ON_DELIVERY;
        if (req.paymentMethod() != null && !req.paymentMethod().isBlank()) {
            try {
                method = PaymentMethod.valueOf(req.paymentMethod().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                method = PaymentMethod.CASH_ON_DELIVERY;
            }
        }
        dto.setPaymentMethod(method);

        OrderDetailDto created = orderService.createForBranchCustomer(dto, customer.getId(), sender.getId());
        String tracking = created.packages().get(0).trackingNumber();
        Map<String, String> receiveInput = new HashMap<>();
        receiveInput.put("trackingNumber", tracking);
        receiveInput.put("weightKg", weight.toPlainString());
        if (req.description() != null) receiveInput.put("description", req.description());

        Map<String, Object> result = new LinkedHashMap<>(receive(branchId, receiveInput, staff));
        result.put("label", getLabel(branchId, tracking, staff));
        activityLogService.write(staff.getId(), "branch.register", Map.of(
            "branchId", branchId,
            "trackingNumber", tracking,
            "orderNumber", created.orderNumber()
        ));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLabel(String branchId, String trackingNumber, AuthUser user) {
        assertBranchAccess(user, branchId);
        et.guzo.domain.entity.Package pkg = findPackage(trackingNumber);
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow(() -> ApiException.notFound("Order not found"));
        Branch branch = branchRepository.findById(branchId).orElseThrow(() -> ApiException.notFound("Branch not found"));
        Map<String, Object> label = new LinkedHashMap<>();
        label.put("trackingNumber", pkg.getTrackingNumber());
        label.put("orderNumber", order.getOrderNumber());
        label.put("pickupPin", pkg.getPickupPin());
        label.put("qrCode", pkg.getQrCode());
        label.put("weightKg", pkg.getWeightKg());
        label.put("description", pkg.getDescription());
        label.put("branch", Map.of("code", branch.getCode(), "name", branch.getName(), "city", branch.getCity()));
        label.put("receiverPhone", order.getReceiverPhone());
        label.put("status", order.getStatus().name());
        enrichPayment(order, label);
        return label;
    }

    private void enrichPayment(Order order, Map<String, Object> target) {
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            target.put("paymentMethod", payment.getMethod().name());
            if (payment.getMethod() == PaymentMethod.CASH_ON_DELIVERY && payment.getStatus() == PaymentStatus.PENDING) {
                target.put("codAmount", payment.getAmount());
                target.put("requiresCod", true);
            }
        });
    }

    private void applyPackageIntake(et.guzo.domain.entity.Package pkg, Map<String, String> input) {
        BigDecimal weight = parseWeight(input.get("weightKg"));
        if (weight != null) pkg.setWeightKg(weight);
        if (input.get("description") != null && !input.get("description").isBlank()) {
            pkg.setDescription(input.get("description"));
        }
    }

    private BigDecimal parseWeight(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("Invalid weightKg");
        }
    }

    @Transactional
    public Map<String, Object> assignShelf(String branchId, Map<String, String> input, AuthUser user) {
        assertBranchAccess(user, branchId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        BranchInventory inv = inventoryRepository.findByPackageId(pkg.getId())
            .orElseThrow(() -> ApiException.badRequest("Parcel is not in branch inventory"));
        if (!branchId.equals(inv.getBranchId())) throw ApiException.badRequest("Parcel belongs to another branch");
        if (inv.getPickedUpAt() != null) throw ApiException.badRequest("Parcel already picked up");
        Instant now = Instant.now();
        inv.setShelfCode(input.get("shelfCode"));
        inv.setZone(input.get("zone"));
        inv.setUpdatedAt(now);
        inventoryRepository.save(inv);
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow();
        trackingService.record(order.getId(), TrackingEventType.SORTED, order.getStatus(),
            "Shelf " + input.get("shelfCode"), user.getId());
        return toInventoryDto(inv, pkg, order);
    }

    @Transactional
    public Map<String, Object> confirmPickup(String branchId, Map<String, String> input, AuthUser user) {
        assertBranchAccess(user, branchId);
        et.guzo.domain.entity.Package pkg = pickupCodeService.verifyPickup(input.get("reference"), input.get("pin"));
        BranchInventory inv = inventoryRepository.findByPackageId(pkg.getId()).orElse(null);
        if (inv != null && !branchId.equals(inv.getBranchId())) {
            throw ApiException.badRequest("Parcel is stored at a different branch");
        }
        Order order = orderRepository.findById(pkg.getOrderId())
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getDestinationBranchId() != null && !branchId.equals(order.getDestinationBranchId())) {
            throw ApiException.badRequest("Parcel is not assigned to this destination branch");
        }
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (Boolean.parseBoolean(input.getOrDefault("collectCod", "false"))) {
            collectCod(order);
        } else if (payment != null
            && payment.getMethod() == et.guzo.domain.enums.PaymentMethod.CASH_ON_DELIVERY
            && payment.getStatus() == et.guzo.domain.enums.PaymentStatus.PENDING) {
            throw ApiException.badRequest("Collect COD cash before confirming pickup");
        }
        orderService.completePickup(pkg.getId());
        Instant now = Instant.now();
        if (inv != null) {
            inv.setPickedUpAt(now);
            inv.setUpdatedAt(now);
            inventoryRepository.save(inv);
        }
        pkg = packageRepository.findById(pkg.getId()).orElse(pkg);
        order = orderRepository.findById(order.getId()).orElse(order);
        return toInventoryDto(inv, pkg, order);
    }

    @Transactional
    public Map<String, Object> markException(String branchId, Map<String, String> input, AuthUser user) {
        assertBranchAccess(user, branchId);
        et.guzo.domain.entity.Package pkg = findPackage(input.get("trackingNumber"));
        Order order = orderRepository.findById(pkg.getOrderId()).orElseThrow();
        String reason = input.getOrDefault("reason", "RETURNED").toUpperCase();
        OrderStatus target = switch (reason) {
            case "DAMAGED", "WRONG_BRANCH", "EXPIRED" -> OrderStatus.RETURNED;
            default -> OrderStatus.RETURNED;
        };
        if (!List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED).contains(order.getStatus())) {
            order.setStatus(target);
            order.setUpdatedAt(Instant.now());
            orderRepository.save(order);
            pkg.setStatus(PackageStatus.RETURNED);
            pkg.setUpdatedAt(Instant.now());
            packageRepository.save(pkg);
            trackingService.record(order.getId(), TrackingEventType.RETURNED, target,
                "Branch exception: " + reason, user.getId());
            notifyStatus(order, target);
        }
        BranchInventory inv = inventoryRepository.findByPackageId(pkg.getId()).orElse(null);
        return toInventoryDto(inv, pkg, order);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listInventory(String branchId, int page, int limit, String state, AuthUser user) {
        assertBranchAccess(user, branchId);
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "receivedAt"));
        Page<BranchInventory> result = "all".equals(state)
            ? inventoryRepository.findByBranchId(branchId, pageable)
            : inventoryRepository.findByBranchIdAndPickedUpAtIsNull(branchId, pageable);
        List<Map<String, Object>> items = result.getContent().stream().map(inv -> {
            et.guzo.domain.entity.Package pkg = packageRepository.findById(inv.getPackageId()).orElse(null);
            Order order = pkg != null ? orderRepository.findById(pkg.getOrderId()).orElse(null) : null;
            return toInventoryDto(inv, pkg, order);
        }).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> lookupShelf(String branchId, String shelfCode, AuthUser user) {
        assertBranchAccess(user, branchId);
        return inventoryRepository.findByBranchIdAndShelfCodeIgnoreCaseAndPickedUpAtIsNull(branchId, shelfCode).stream()
            .map(inv -> {
                et.guzo.domain.entity.Package pkg = packageRepository.findById(inv.getPackageId()).orElse(null);
                Order order = pkg != null ? orderRepository.findById(pkg.getOrderId()).orElse(null) : null;
                return toInventoryDto(inv, pkg, order);
            }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> stats(String branchId, AuthUser user) {
        assertBranchAccess(user, branchId);
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long inStock = inventoryRepository.countByBranchIdAndPickedUpAtIsNull(branchId);
        long incomingToday = inventoryRepository.countByBranchIdAndReceivedAtAfter(branchId, startOfDay);
        long pickedUpToday = inventoryRepository.countByBranchIdAndPickedUpAtAfter(branchId, startOfDay);
        long readyForPickup = orderRepository.countByDestinationBranchIdAndStatus(branchId, OrderStatus.READY_FOR_PICKUP);
        long outgoing = orderRepository.countByOriginBranchIdAndStatusIn(branchId,
            List.of(OrderStatus.IN_TRANSIT, OrderStatus.AT_WAREHOUSE, OrderStatus.OUT_FOR_DELIVERY));
        return Map.of(
            "totals", Map.of(
                "inStock", inStock,
                "incomingToday", incomingToday,
                "outgoing", outgoing,
                "readyForPickup", readyForPickup,
                "pickedUpToday", pickedUpToday
            )
        );
    }

    private OrderStatus resolveReceiveStatus(Order order, String branchId) {
        if (branchId.equals(order.getDestinationBranchId())) {
            return OrderStatus.AT_DESTINATION_BRANCH;
        }
        if (branchId.equals(order.getOriginBranchId()) || order.getPickupMethod() == PickupMethod.DROP_AT_BRANCH) {
            return OrderStatus.AT_BRANCH;
        }
        return OrderStatus.AT_BRANCH;
    }

    private void collectCod(Order order) {
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            if (payment.getMethod() == PaymentMethod.CASH_ON_DELIVERY && payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidAt(Instant.now());
                payment.setUpdatedAt(Instant.now());
                paymentRepository.save(payment);
            }
        });
    }

    private void notifyStatus(Order order, OrderStatus status) {
        customerRepository.findById(order.getCustomerId()).ifPresent(customer ->
            notificationService.notify(
                customer.getUserId(),
                "ORDER_STATUS",
                "Parcel update",
                "Order " + order.getOrderNumber() + " is now " + status.name().toLowerCase().replace('_', ' ')
            )
        );
        if (order.getReceiverUserId() != null) {
            notificationService.notify(
                order.getReceiverUserId(),
                "ORDER_STATUS",
                "Incoming parcel",
                "A parcel for you is now " + status.name().toLowerCase().replace('_', ' ')
            );
        }
    }

    private void ensureBranch(String id) {
        branchRepository.findById(id).orElseThrow(() -> ApiException.notFound("Branch not found"));
    }

    private et.guzo.domain.entity.Package findPackage(String trackingNumber) {
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw ApiException.badRequest("trackingNumber is required");
        }
        return packageRepository.findByTrackingNumber(trackingNumber.trim())
            .orElseThrow(() -> ApiException.notFound("No parcel found for that tracking number"));
    }

    private Map<String, Object> toInventoryDto(BranchInventory inv, et.guzo.domain.entity.Package pkg, Order order) {
        Map<String, Object> dto = new LinkedHashMap<>();
        if (inv != null) {
            dto.put("id", inv.getId());
            dto.put("shelfCode", inv.getShelfCode());
            dto.put("zone", inv.getZone());
            dto.put("receivedAt", inv.getReceivedAt());
            dto.put("pickedUpAt", inv.getPickedUpAt());
            dto.put("measuredWeightKg", inv.getMeasuredWeightKg());
            Branch branch = branchRepository.findById(inv.getBranchId()).orElse(null);
            if (branch != null) {
                dto.put("branch", Map.of("id", branch.getId(), "code", branch.getCode(), "name", branch.getName()));
            }
        }
        if (pkg != null) {
            Map<String, Object> pkgDto = new LinkedHashMap<>();
            pkgDto.put("id", pkg.getId());
            pkgDto.put("trackingNumber", pkg.getTrackingNumber());
            pkgDto.put("status", pkg.getStatus().name());
            pkgDto.put("pickupPin", pkg.getPickupPin());
            pkgDto.put("description", pkg.getDescription());
            pkgDto.put("weightKg", pkg.getWeightKg());
            if (order != null) {
                Map<String, Object> orderDto = new LinkedHashMap<>();
                orderDto.put("id", order.getId());
                orderDto.put("orderNumber", order.getOrderNumber());
                orderDto.put("status", order.getStatus().name());
                orderDto.put("receiverPhone", order.getReceiverPhone());
                addressRepository.findById(order.getDropoffAddressId()).ifPresent(dropoff ->
                    orderDto.put("dropoffAddress", Map.of(
                        "city", dropoff.getCity(),
                        "line1", dropoff.getLine1(),
                        "contactName", dropoff.getContactName() != null ? dropoff.getContactName() : ""
                    ))
                );
                enrichPayment(order, orderDto);
                pkgDto.put("order", orderDto);
            }
            dto.put("package", pkgDto);
        }
        return dto;
    }
}
