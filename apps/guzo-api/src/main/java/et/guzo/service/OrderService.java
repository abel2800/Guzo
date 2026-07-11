package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Address;
import et.guzo.domain.entity.Branch;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.Delivery;
import et.guzo.domain.entity.Driver;
import et.guzo.domain.entity.Merchant;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.Payment;
import et.guzo.domain.entity.StoredFile;
import et.guzo.domain.entity.User;
import et.guzo.domain.enums.*;
import et.guzo.realtime.SocketEvents;
import et.guzo.realtime.SocketRealtimeService;
import et.guzo.repository.*;
import et.guzo.security.AuthUser;
import et.guzo.security.RoleChecker;
import et.guzo.service.payment.PaymentGateway;
import et.guzo.service.payment.PaymentProvider;
import et.guzo.util.IdUtil;
import et.guzo.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final PackageRepository packageRepository;
    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final PaymentRepository paymentRepository;
    private final ReceiverDetectionService receiverDetectionService;
    private final PickupCodeService pickupCodeService;
    private final OrderStateMachine orderStateMachine;
    private final MapsService mapsService;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;
    private final TrackingService trackingService;
    private final MerchantPlatformService merchantPlatformService;
    private final DeliveryRepository deliveryRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final FileStorageService fileStorageService;
    private final SocketRealtimeService socketRealtimeService;
    private final BranchRepository branchRepository;
    private final SmsService smsService;

    @Transactional(readOnly = true)
    public PriceBreakdown quote(OrderQuoteRequest dto) {
        return calculatePrice(dto.getPickup(), dto.getDropoff(), dto.getDeliveryType(),
            dto.resolveWeightKg(), dto.isHasInsurance(), dto.getInsuranceAmount());
    }

    @Transactional
    public OrderDetailDto create(OrderCreateRequest dto, String userId) {
        Merchant merchant = merchantRepository.findByUserId(userId).orElse(null);
        if (merchant != null) {
            return createInternal(dto, resolveMerchantCustomerId(merchant.getId()), merchant.getId(), userId);
        }
        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a customer"));
        return createInternal(dto, customer.getId(), null, userId);
    }

    @Transactional
    public OrderDetailDto createForBranchCustomer(OrderCreateRequest dto, String customerId, String actorUserId) {
        return createInternal(dto, customerId, null, actorUserId);
    }

    @Transactional
    public OrderDetailDto createForMerchant(OrderCreateRequest dto, String merchantId) {
        return createInternal(dto, resolveMerchantCustomerId(merchantId), merchantId, null);
    }

    private OrderDetailDto createInternal(OrderCreateRequest dto, String customerId, String merchantId, String actorUserId) {
        PriceBreakdown price = calculatePrice(dto.getPickup(), dto.getDropoff(), dto.getDeliveryType(),
            dto.resolveWeightKg(), dto.isHasInsurance(), dto.getInsuranceAmount());
        PaymentMethod method = dto.getPaymentMethod() != null ? dto.getPaymentMethod() : PaymentMethod.FAKE;
        PaymentProvider provider = paymentGateway.resolve(method);

        Instant now = Instant.now();
        String ownerUserId = actorUserId != null ? actorUserId : customerRepository.findById(customerId)
            .map(Customer::getUserId).orElse(null);
        Address pickup = saveAddress(dto.getPickup(), ownerUserId, now);
        Address dropoff = saveAddress(dto.getDropoff(), ownerUserId, now);

        ReceiverDetectionService.ReceiverMatch receiver = receiverDetectionService.detect(
            dto.getReceiverPhone(), dto.getReceiverGuzoId());

        String orderNumber = IdUtil.orderNumber();
        String paymentRef = IdUtil.paymentReference();
        PaymentProvider.ChargeResult charge = provider.charge(new PaymentProvider.ChargeRequest(
            price.totalAmount(), price.currency(), paymentRef, "Payment for order " + orderNumber, dto.getReceiverPhone()
        ));
        boolean paid = charge.status() == PaymentStatus.PAID;

        Order order = new Order();
        order.setId(IdUtil.cuid());
        order.setOrderNumber(orderNumber);
        order.setCustomerId(customerId);
        order.setMerchantId(merchantId);
        order.setPickupAddressId(pickup.getId());
        order.setDropoffAddressId(dropoff.getId());
        order.setDeliveryType(dto.getDeliveryType() != null ? dto.getDeliveryType() : DeliveryType.STANDARD);
        order.setStatus(paid ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT);
        order.setPickupMethod(dto.getPickupMethod());
        order.setHasInsurance(dto.isHasInsurance());
        order.setInsuranceAmount(dto.getInsuranceAmount());
        applyReceiver(order, receiver, dto);
        order.setOriginBranchId(dto.getOriginBranchId());
        order.setDestinationBranchId(dto.getDestinationBranchId());
        applyPricing(order, price);
        order.setNotes(dto.getNotes());
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orderRepository.save(order);

        et.guzo.domain.entity.Package pkg = new et.guzo.domain.entity.Package();
        pkg.setId(IdUtil.cuid());
        pkg.setOrderId(order.getId());
        pkg.setTrackingNumber(IdUtil.trackingNumber());
        pkg.setWeightKg(dto.resolveWeightKg());
        if (dto.getPackageInput() != null && dto.getPackageInput().getDescription() != null) {
            pkg.setDescription(dto.getPackageInput().getDescription());
        }
        pkg.setCreatedAt(now);
        pkg.setUpdatedAt(now);
        packageRepository.save(pkg);
        pickupCodeService.assignCodes(pkg);

        Payment payment = new Payment();
        payment.setId(IdUtil.cuid());
        payment.setOrderId(order.getId());
        payment.setReference(paymentRef);
        payment.setProvider(provider.method().name().toLowerCase());
        payment.setProviderRef(charge.providerRef());
        payment.setMethod(method);
        payment.setStatus(charge.status());
        payment.setAmount(price.totalAmount());
        payment.setCurrency(price.currency());
        if (paid) payment.setPaidAt(now);
        payment.setCreatedAt(now);
        payment.setUpdatedAt(now);
        paymentRepository.save(payment);

        invoiceService.createForOrder(order);

        trackingService.record(order.getId(), TrackingEventType.ORDER_CREATED, order.getStatus(), "Order created", actorUserId);
        if (paid) {
            trackingService.record(order.getId(), TrackingEventType.PAYMENT_CONFIRMED, order.getStatus(), "Payment confirmed", actorUserId);
        }

        if (actorUserId != null) {
            notificationService.notify(actorUserId, "ORDER_CREATED", "Shipment booked",
                "Order " + orderNumber + " is " + order.getStatus().name().toLowerCase().replace('_', ' ') + ".");
        }
        if (receiver.found() && receiver.userId() != null) {
            notificationService.notify(receiver.userId(), "PARCEL_INCOMING", "Incoming parcel",
                "A parcel is on its way. Tracking: " + pkg.getTrackingNumber());
        }
        if (merchantId != null) {
            merchantPlatformService.dispatchEvent(merchantId, "parcel.created",
                "{\"orderId\":\"" + order.getId() + "\",\"trackingNumber\":\"" + pkg.getTrackingNumber() + "\"}");
        }

        emitOrderStatus(order.getId(), order.getStatus());
        return toDetail(order);
    }

    @Transactional
    public OrderDetailDto assignDriver(String orderId, AssignDriverRequest dto, AuthUser user) {
        RoleChecker.requireAdmin(user);
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.ASSIGNED) {
            throw ApiException.badRequest("Order cannot be assigned in status " + order.getStatus());
        }
        Instant now = Instant.now();
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseGet(() -> {
            Delivery d = new Delivery();
            d.setId(IdUtil.cuid());
            d.setOrderId(orderId);
            d.setCreatedAt(now);
            return d;
        });
        delivery.setDriverId(dto.driverId());
        delivery.setAssignedAt(now);
        delivery.setUpdatedAt(now);
        deliveryRepository.save(delivery);
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            orderStateMachine.assertTransition(order.getStatus(), OrderStatus.ASSIGNED);
            order.setStatus(OrderStatus.ASSIGNED);
            order.setUpdatedAt(now);
            orderRepository.save(order);
            trackingService.record(orderId, TrackingEventType.DRIVER_ASSIGNED, OrderStatus.ASSIGNED, "Driver assigned", user.getId());
            emitOrderStatus(orderId, OrderStatus.ASSIGNED);
        }
        return toDetail(order);
    }

    @Transactional
    public OrderDetailDto acceptOrder(String orderId, AuthUser user) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (deliveryRepository.findByOrderId(orderId).isPresent()) {
            throw ApiException.badRequest("This order has already been assigned");
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw ApiException.badRequest("Only confirmed orders can be accepted");
        }
        Instant now = Instant.now();
        Delivery delivery = new Delivery();
        delivery.setId(IdUtil.cuid());
        delivery.setOrderId(orderId);
        delivery.setDriverId(driver.getId());
        delivery.setAssignedAt(now);
        delivery.setAcceptedAt(now);
        delivery.setCreatedAt(now);
        delivery.setUpdatedAt(now);
        deliveryRepository.save(delivery);
        orderStateMachine.assertTransition(order.getStatus(), OrderStatus.ASSIGNED);
        order.setStatus(OrderStatus.ASSIGNED);
        order.setUpdatedAt(now);
        orderRepository.save(order);
        trackingService.record(orderId, TrackingEventType.DRIVER_ASSIGNED, OrderStatus.ASSIGNED, "Driver accepted order", user.getId());
        emitOrderStatus(orderId, OrderStatus.ASSIGNED);
        return toDetail(order);
    }

    @Transactional
    public Map<String, Object> createBulk(List<OrderCreateRequest> orders, String userId) {
        int created = 0;
        int failed = 0;
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        for (int i = 0; i < orders.size(); i++) {
            try {
                OrderDetailDto order = create(orders.get(i), userId);
                created++;
                results.add(Map.of(
                    "index", i, "success", true,
                    "orderNumber", order.orderNumber(),
                    "trackingNumber", order.packages().isEmpty() ? "" : order.packages().get(0).trackingNumber()
                ));
            } catch (Exception e) {
                failed++;
                results.add(Map.of("index", i, "success", false, "error", e.getMessage()));
            }
        }
        return Map.of("total", orders.size(), "created", created, "failed", failed, "results", results);
    }

    @Transactional
    public OrderDetailDto confirmPayment(String paymentReference) {
        Payment payment = paymentRepository.findByReference(paymentReference)
            .orElseThrow(() -> ApiException.notFound("Payment not found"));
        Instant now = Instant.now();
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(now);
        payment.setUpdatedAt(now);
        paymentRepository.save(payment);
        Order order = orderRepository.findById(payment.getOrderId())
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(now);
            orderRepository.save(order);
            trackingService.record(order.getId(), TrackingEventType.PAYMENT_CONFIRMED, OrderStatus.CONFIRMED, "Payment confirmed", null);
            invoiceRepository.findByOrderId(order.getId()).ifPresent(inv -> {
                inv.setStatus(InvoiceStatus.PAID);
                inv.setPaidAt(now);
                inv.setUpdatedAt(now);
                invoiceRepository.save(inv);
            });
        }
        return toDetail(order);
    }

    @Transactional
    public OrderDetailDto submitProof(String orderId, AuthUser user, org.springframework.web.multipart.MultipartFile photo,
                                      org.springframework.web.multipart.MultipartFile signature, String recipientName,
                                      String note) {
        if (photo == null || photo.isEmpty()) throw ApiException.badRequest("A delivery photo is required");
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) throw ApiException.forbidden("This delivery is not assigned to you");
        if (order.getStatus() == OrderStatus.DELIVERED) throw ApiException.badRequest("Order is already delivered");
        StoredFile proof = fileStorageService.store(photo, user.getId(), FileCategory.PROOF_OF_DELIVERY);
        if (signature != null && !signature.isEmpty()) {
            delivery.setSignatureFileId(fileStorageService.store(signature, user.getId(), FileCategory.SIGNATURE).getId());
        }
        Instant now = Instant.now();
        delivery.setProofFileId(proof.getId());
        delivery.setRecipientName(recipientName);
        delivery.setDeliveredAt(now);
        delivery.setUpdatedAt(now);
        deliveryRepository.save(delivery);
        driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
        driver.setUpdatedAt(now);
        driverRepository.save(driver);
        return updateStatus(orderId, new OrderStatusUpdateRequest(OrderStatus.DELIVERED,
            note != null ? note : (recipientName != null ? "Delivered to " + recipientName : "Delivered")), user);
    }

    private OrderDetailDto toDetail(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(order.getId()), payment, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(AuthUser user, int page, int limit, String status, String search, String scope) {
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> result;
        if ("available".equalsIgnoreCase(scope)) {
            List<String> ids = deliveryRepository.findAvailableOrderIds();
            result = ids.isEmpty()
                ? Page.empty(pageable)
                : orderRepository.findByIdIn(ids, pageable);
        } else if ("incoming".equalsIgnoreCase(scope)) {
            Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("No customer profile"));
            User u = userRepository.findById(user.getId()).orElseThrow(() -> ApiException.notFound("User not found"));
            result = orderRepository.findIncomingForReceiver(customer.getId(), u.getGuzoId(), u.getPhone(), pageable);
        } else if (RoleChecker.isAdmin(user)) {
            if (search != null && !search.isBlank()) {
                result = orderRepository.searchAll(search, pageable);
            } else if (status != null && !status.isBlank()) {
                result = orderRepository.findByStatus(OrderStatus.valueOf(status), pageable);
            } else {
                result = orderRepository.findAll(pageable);
            }
        } else if (RoleChecker.hasAnyRole(user, "DRIVER")) {
            Driver driver = driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
            result = orderRepository.findByDriverId(driver.getId(), pageable);
        } else if (RoleChecker.hasAnyRole(user, "MERCHANT")) {
            Merchant merchant = merchantRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a merchant"));
            if (status != null && !status.isBlank()) {
                result = orderRepository.findByMerchantIdAndStatus(merchant.getId(), OrderStatus.valueOf(status), pageable);
            } else {
                result = orderRepository.findByMerchantId(merchant.getId(), pageable);
            }
        } else {
            Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("No customer profile"));
            if (search != null && !search.isBlank()) {
                result = orderRepository.searchByCustomer(customer.getId(), search, pageable);
            } else if (status != null && !status.isBlank()) {
                result = orderRepository.findByCustomerIdAndStatus(customer.getId(), OrderStatus.valueOf(status), pageable);
            } else {
                result = orderRepository.findByCustomerId(customer.getId(), pageable);
            }
        }
        List<OrderDetailDto> items = result.getContent().stream().map(this::toDetail).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public OrderDetailDto getById(String orderId, AuthUser user) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        assertCanAccess(order, user);
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(orderId), payment, null);
    }

    @Transactional(readOnly = true)
    public OrderDetailDto track(String reference) {
        Order order = orderRepository.findByOrderNumber(reference)
            .orElseGet(() -> packageRepository.findByTrackingNumber(reference)
                .map(p -> orderRepository.findById(p.getOrderId()).orElseThrow(() -> ApiException.notFound("Order not found")))
                .orElseThrow(() -> ApiException.notFound("No shipment found for that reference")));
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(order.getId()), payment, null);
    }

    @Transactional
    public OrderDetailDto updateStatus(String orderId, OrderStatusUpdateRequest dto, AuthUser user) {
        RoleChecker.requireStatusUpdater(user);
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        orderStateMachine.assertTransition(order.getStatus(), dto.status());
        order.setStatus(dto.status());
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);
        trackingService.record(orderId, mapStatusToEvent(dto.status()), dto.status(),
            dto.note() != null ? dto.note() : "Status updated to " + dto.status(), user.getId(),
            dto.latitude(), dto.longitude());
        if (order.getMerchantId() != null) {
            merchantPlatformService.dispatchEvent(order.getMerchantId(), "parcel.status_changed",
                "{\"orderId\":\"" + orderId + "\",\"status\":\"" + dto.status() + "\"}");
        }
        notifyCustomerStatusChange(order, dto.status());
        emitOrderStatus(orderId, dto.status());
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(orderId), payment, null);
    }

    @Transactional
    public OrderDetailDto cancel(String orderId, AuthUser user) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        assertCanAccess(order, user);
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("Order cannot be cancelled");
        }
        orderStateMachine.assertTransition(order.getStatus(), OrderStatus.CANCELLED);
        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);
        trackingService.record(orderId, TrackingEventType.CANCELLED, OrderStatus.CANCELLED, "Order cancelled", user.getId());
        notifyCustomerStatusChange(order, OrderStatus.CANCELLED);
        emitOrderStatus(orderId, OrderStatus.CANCELLED);
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(orderId), payment, null);
    }

    @Transactional
    public OrderDetailDto confirmPickupWithProof(String orderId, AuthUser user,
        org.springframework.web.multipart.MultipartFile photo,
        org.springframework.web.multipart.MultipartFile signature, String note) {
        if (photo == null || photo.isEmpty()) throw ApiException.badRequest("Pickup photo is required");
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) throw ApiException.forbidden("This delivery is not assigned to you");
        if (order.getStatus() != OrderStatus.ASSIGNED && order.getStatus() != OrderStatus.CONFIRMED) {
            throw ApiException.badRequest("Cannot confirm pickup when order is " + order.getStatus());
        }
        fileStorageService.store(photo, user.getId(), FileCategory.PARCEL_INTAKE);
        if (signature != null && !signature.isEmpty()) {
            fileStorageService.store(signature, user.getId(), FileCategory.SIGNATURE);
        }
        return updateStatus(orderId, new OrderStatusUpdateRequest(OrderStatus.PICKED_UP,
            note != null ? note : "Picked up with photo proof"), user);
    }

    @Transactional
    public OrderDetailDto branchHandoff(String orderId, AuthUser user, String branchId, String trackingNumber) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) throw ApiException.forbidden("This delivery is not assigned to you");
        Branch branch = branchRepository.findById(branchId).orElseThrow(() -> ApiException.notFound("Branch not found"));
        et.guzo.domain.entity.Package pkg = packageRepository.findByOrderId(orderId).stream()
            .filter(p -> p.getTrackingNumber().equals(trackingNumber.trim()))
            .findFirst()
            .orElseThrow(() -> ApiException.badRequest("Tracking number does not match this order"));
        pkg.setStatus(PackageStatus.AT_BRANCH);
        pkg.setUpdatedAt(Instant.now());
        packageRepository.save(pkg);
        return updateStatus(orderId, new OrderStatusUpdateRequest(OrderStatus.AT_BRANCH,
            "Dropped at branch " + branch.getName()), user);
    }

    @Transactional
    public OrderDetailDto markFailed(String orderId, AuthUser user, String note) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) throw ApiException.forbidden("This delivery is not assigned to you");
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw ApiException.badRequest("Only out-for-delivery orders can be marked failed");
        }
        return updateStatus(orderId, new OrderStatusUpdateRequest(OrderStatus.FAILED,
            note != null ? note : "Delivery attempt failed"), user);
    }

    @Transactional
    public OrderDetailDto reattemptDelivery(String orderId, AuthUser user) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) throw ApiException.forbidden("This delivery is not assigned to you");
        if (order.getStatus() != OrderStatus.FAILED) {
            throw ApiException.badRequest("Only failed deliveries can be reattempted");
        }
        return updateStatus(orderId, new OrderStatusUpdateRequest(OrderStatus.OUT_FOR_DELIVERY, "Driver reattempting delivery"), user);
    }

    @Transactional
    public OrderDetailDto scanPickup(String orderId, AuthUser user, ScanPickupRequest input) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) {
            throw ApiException.forbidden("This delivery is not assigned to you");
        }
        if (order.getStatus() != OrderStatus.ASSIGNED && order.getStatus() != OrderStatus.AT_BRANCH) {
            throw ApiException.badRequest("Cannot scan pickup when order is " + order.getStatus());
        }

        et.guzo.domain.entity.Package pkg = pickupCodeService.verifyPickup(input.reference().trim(), null);
        if (!orderId.equals(pkg.getOrderId())) {
            throw ApiException.badRequest("Scanned parcel does not match this delivery");
        }

        return updateStatus(orderId, new OrderStatusUpdateRequest(
            OrderStatus.PICKED_UP,
            "Parcel scanned at pickup (" + pkg.getTrackingNumber() + ")",
            input.latitude(),
            input.longitude()
        ), user);
    }

    @Transactional
    public OrderDetailDto notifyDriverArrived(String orderId, AuthUser user, DriverArrivedRequest input) {
        Driver driver = driverRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.badRequest("Authenticated user is not a driver"));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Delivery delivery = deliveryRepository.findByOrderId(orderId).orElseThrow(() -> ApiException.badRequest("No delivery for this order"));
        if (!driver.getId().equals(delivery.getDriverId())) {
            throw ApiException.forbidden("This delivery is not assigned to you");
        }
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY && order.getStatus() != OrderStatus.IN_TRANSIT) {
            throw ApiException.badRequest("Arrival can only be reported while en route to the receiver");
        }

        User driverUser = userRepository.findById(user.getId()).orElse(null);
        String driverName = driverUser != null
            ? (driverUser.getFirstName() + " " + driverUser.getLastName()).trim()
            : "Your driver";
        String tracking = packageRepository.findByOrderId(orderId).stream()
            .findFirst()
            .map(et.guzo.domain.entity.Package::getTrackingNumber)
            .orElse(order.getOrderNumber());

        String dropPhone = null;
        if (order.getDropoffAddressId() != null) {
            dropPhone = addressRepository.findById(order.getDropoffAddressId())
                .map(Address::getContactPhone)
                .orElse(null);
        }
        String receiverPhone = order.getReceiverPhone() != null ? order.getReceiverPhone() : dropPhone;

        trackingService.record(
            orderId,
            TrackingEventType.OUT_FOR_DELIVERY,
            "Driver arrived",
            driverName + " has arrived. Please come out to collect your parcel.",
            user.getId(),
            input != null ? input.latitude() : null,
            input != null ? input.longitude() : null
        );

        String title = "Driver has arrived";
        String body = driverName + " is at your location with parcel " + tracking + ". Please collect your package.";
        if (order.getReceiverUserId() != null) {
            notificationService.notify(order.getReceiverUserId(), "DRIVER_ARRIVED", title, body);
        }
        if (receiverPhone != null && !receiverPhone.isBlank()) {
            smsService.send(receiverPhone, "Guzo: " + title + ". " + body);
        }

        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        return toDetail(order, packageRepository.findByOrderId(orderId), payment, null);
    }

    @Transactional
    public OrderDetailDto completePickup(String packageId) {
        et.guzo.domain.entity.Package pkg = packageRepository.findById(packageId)
            .orElseThrow(() -> ApiException.notFound("Parcel not found"));
        Order order = orderRepository.findById(pkg.getOrderId())
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.getStatus() == OrderStatus.AT_DESTINATION_BRANCH) {
            orderStateMachine.assertTransition(order.getStatus(), OrderStatus.READY_FOR_PICKUP);
            order.setStatus(OrderStatus.READY_FOR_PICKUP);
        } else if (order.getStatus() == OrderStatus.AT_BRANCH) {
            order.setStatus(OrderStatus.READY_FOR_PICKUP);
        }
        orderStateMachine.assertTransition(order.getStatus(), OrderStatus.DELIVERED);
        order.setStatus(OrderStatus.DELIVERED);
        order.setUpdatedAt(Instant.now());
        orderRepository.save(order);
        pkg.setStatus(PackageStatus.DELIVERED);
        pkg.setUpdatedAt(Instant.now());
        packageRepository.save(pkg);
        trackingService.record(order.getId(), TrackingEventType.DELIVERED, OrderStatus.DELIVERED, "Picked up at branch", null);
        if (order.getMerchantId() != null) {
            merchantPlatformService.dispatchEvent(order.getMerchantId(), "parcel.status_changed",
                "{\"orderId\":\"" + order.getId() + "\",\"status\":\"DELIVERED\"}");
        }
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        return toDetail(order, List.of(pkg), payment, null);
    }

    private String resolveMerchantCustomerId(String merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
            .orElseThrow(() -> ApiException.badRequest("Merchant not found"));
        return customerRepository.findByUserId(merchant.getUserId())
            .map(Customer::getId)
            .orElseGet(() -> {
                Instant now = Instant.now();
                Customer c = new Customer();
                c.setId(IdUtil.cuid());
                c.setUserId(merchant.getUserId());
                c.setCustomerCode(IdUtil.customerCode());
                c.setWalletBalance(BigDecimal.ZERO);
                c.setCreatedAt(now);
                c.setUpdatedAt(now);
                return customerRepository.save(c).getId();
            });
    }

    private void assertCanAccess(Order order, AuthUser user) {
        if (RoleChecker.isAdmin(user)) return;
        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);
        if (customer != null && customer.getId().equals(order.getCustomerId())) return;
        if (order.getReceiverUserId() != null && order.getReceiverUserId().equals(user.getId())) return;
        throw ApiException.forbidden("Not allowed to access this order");
    }

    private void applyReceiver(Order order, ReceiverDetectionService.ReceiverMatch receiver, OrderCreateRequest dto) {
        if (receiver.found()) {
            order.setReceiverUserId(receiver.userId());
            order.setReceiverGuzoId(receiver.guzoId());
            order.setReceiverPhone(receiver.phone());
        } else {
            order.setReceiverPhone(dto.getReceiverPhone());
            order.setReceiverGuzoId(dto.getReceiverGuzoId());
        }
    }

    private TrackingEventType mapStatusToEvent(OrderStatus status) {
        return switch (status) {
            case PICKED_UP -> TrackingEventType.PICKED_UP;
            case IN_TRANSIT -> TrackingEventType.IN_TRANSIT;
            case OUT_FOR_DELIVERY -> TrackingEventType.OUT_FOR_DELIVERY;
            case DELIVERED -> TrackingEventType.DELIVERED;
            case CANCELLED -> TrackingEventType.CANCELLED;
            case RETURNED -> TrackingEventType.RETURNED;
            default -> TrackingEventType.EXCEPTION;
        };
    }

    private PriceBreakdown calculatePrice(AddressInput pickup, AddressInput dropoff, DeliveryType type,
                                          BigDecimal weightKg, boolean insured, BigDecimal insuranceAmount) {
        MapsService.LatLng from = mapsService.geocode(pickup);
        MapsService.LatLng to = mapsService.geocode(dropoff);
        MapRouteResult route = mapsService.route(from, to);
        BigDecimal distanceKm = BigDecimal.valueOf(route.distanceKm()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal base = BigDecimal.valueOf(50);
        BigDecimal distanceFee = BigDecimal.valueOf(12).multiply(distanceKm);
        BigDecimal weight = weightKg != null ? weightKg : BigDecimal.ONE;
        BigDecimal weightFee = weight.multiply(BigDecimal.valueOf(5));
        BigDecimal surge = type == DeliveryType.EXPRESS ? BigDecimal.valueOf(30)
            : type == DeliveryType.SAME_DAY ? BigDecimal.valueOf(50) : BigDecimal.ZERO;
        BigDecimal insurance = insured && insuranceAmount != null ? insuranceAmount : BigDecimal.ZERO;
        BigDecimal subtotal = base.add(distanceFee).add(weightFee).add(surge).add(insurance);
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);
        return new PriceBreakdown(distanceKm, base, distanceFee, weightFee, surge, BigDecimal.ZERO, tax, total, "ETB");
    }

    private void applyPricing(Order order, PriceBreakdown price) {
        order.setDistanceKm(price.distanceKm());
        order.setBaseFee(price.baseFee());
        order.setDistanceFee(price.distanceFee());
        order.setWeightFee(price.weightFee());
        order.setSurge(price.surge());
        order.setDiscount(price.discount());
        order.setTax(price.tax());
        order.setTotalAmount(price.totalAmount());
        order.setCurrency(price.currency());
    }

    private Address saveAddress(AddressInput input, String userId, Instant now) {
        Address a = new Address();
        a.setId(IdUtil.cuid());
        a.setUserId(userId);
        a.setContactName(input.contactName());
        a.setContactPhone(input.contactPhone());
        if (input.line1() == null || input.line1().isBlank()) {
            throw ApiException.badRequest("Address line1 is required");
        }
        a.setLine1(input.line1());
        a.setLine2(input.line2());
        a.setCity(input.city());
        a.setState(input.state());
        a.setCountry(input.country() != null ? input.country() : "ET");
        a.setPostalCode(input.postalCode());
        MapsService.LatLng coords = mapsService.geocode(input);
        a.setLatitude(coords.lat());
        a.setLongitude(coords.lng());
        a.setCreatedAt(now);
        a.setUpdatedAt(now);
        return addressRepository.save(a);
    }

    private OrderDetailDto toDetail(Order order, List<et.guzo.domain.entity.Package> packages, Payment payment, String redirectUrl) {
        Address pickup = addressRepository.findById(order.getPickupAddressId()).orElse(null);
        Address dropoff = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
        PriceBreakdown pricing = new PriceBreakdown(
            order.getDistanceKm(), order.getBaseFee(), order.getDistanceFee(), order.getWeightFee(),
            order.getSurge(), order.getDiscount(), order.getTax(), order.getTotalAmount(), order.getCurrency()
        );
        List<OrderDetailDto.PackageDto> pkgDtos = packages.stream().map(p ->
            new OrderDetailDto.PackageDto(p.getId(), p.getTrackingNumber(), p.getWeightKg(), p.getDescription(), p.getPickupPin(), p.getQrCode())
        ).toList();
        List<OrderDetailDto.TrackingEventDto> events = trackingService.listForOrder(order.getId()).stream()
            .map(e -> new OrderDetailDto.TrackingEventDto(
                e.getId(), e.getType().name(), e.getStatus(), e.getDescription(),
                e.getLatitude(), e.getLongitude(), e.getCreatedAt()
            )).toList();
        OrderDetailDto.PaymentSummaryDto payDto = payment == null ? null : new OrderDetailDto.PaymentSummaryDto(
            payment.getStatus().name(), payment.getAmount(), payment.getCurrency(), redirectUrl
        );
        OrderDetailDto.InvoiceSummaryDto invoiceDto = invoiceDto(order);
        OrderDetailDto.CustomerSummaryDto customerDto = null;
        Customer customer = customerRepository.findById(order.getCustomerId()).orElse(null);
        if (customer != null) {
            User user = userRepository.findById(customer.getUserId()).orElse(null);
            if (user != null) {
                customerDto = new OrderDetailDto.CustomerSummaryDto(customer.getId(),
                    new OrderDetailDto.CustomerSummaryDto.UserSummaryDto(user.getFirstName(), user.getLastName(), user.getPhone()));
            }
        }
        OrderDetailDto.DeliverySummaryDto deliveryDto = null;
        Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
        if (delivery != null) {
            Driver driver = delivery.getDriverId() != null ? driverRepository.findById(delivery.getDriverId()).orElse(null) : null;
            OrderDetailDto.DeliverySummaryDto.DriverSummaryDto driverDto = null;
            if (driver != null) {
                User du = userRepository.findById(driver.getUserId()).orElse(null);
                if (du != null) {
                    driverDto = new OrderDetailDto.DeliverySummaryDto.DriverSummaryDto(
                        driver.getId(), driver.getCurrentLat(), driver.getCurrentLng(),
                        new OrderDetailDto.DeliverySummaryDto.DriverSummaryDto.UserSummaryDto(
                            du.getFirstName(), du.getLastName(), du.getPhone())
                    );
                }
            }
            deliveryDto = new OrderDetailDto.DeliverySummaryDto(
                delivery.getId(), delivery.getDriverId(), delivery.getRecipientName(), delivery.getDeliveredAt(), driverDto
            );
        }
        return new OrderDetailDto(
            order.getId(), order.getOrderNumber(), order.getStatus(), order.getDeliveryType(), order.getPickupMethod(),
            order.getDistanceKm(), order.getTotalAmount(), order.getCurrency(), order.getCreatedAt(), order.getEstimatedDeliveryAt(),
            order.getReceiverGuzoId(), order.getReceiverPhone(), order.getOriginBranchId(), order.getDestinationBranchId(),
            toAddressDto(pickup), toAddressDto(dropoff), pkgDtos, events, payDto, invoiceDto, customerDto, deliveryDto, pricing
        );
    }

    private OrderDetailDto.InvoiceSummaryDto invoiceDto(Order order) {
        return invoiceRepository.findByOrderId(order.getId())
            .map(inv -> new OrderDetailDto.InvoiceSummaryDto(inv.getInvoiceNumber(), inv.getStatus().name(), inv.getTotal()))
            .orElse(null);
    }

    private OrderDetailDto.AddressDto toAddressDto(Address a) {
        if (a == null) return null;
        return new OrderDetailDto.AddressDto(
            a.getId(), a.getLine1(), a.getLine2(), a.getCity(), a.getState(), a.getCountry(),
            a.getLatitude(), a.getLongitude(), a.getContactName(), a.getContactPhone()
        );
    }

    private void emitOrderStatus(String orderId, OrderStatus status) {
        Map<String, String> payload = Map.of("orderId", orderId, "status", status.name());
        socketRealtimeService.emitToOrder(orderId, SocketEvents.ORDER_STATUS, payload);
        socketRealtimeService.emitToAdmins(SocketEvents.ORDER_STATUS, payload);
    }

    private void notifyCustomerStatusChange(Order order, OrderStatus status) {
        customerRepository.findById(order.getCustomerId()).ifPresent(customer ->
            notificationService.notify(
                customer.getUserId(),
                "ORDER_STATUS",
                "Order update",
                "Your order " + order.getOrderNumber() + " is now " + status.name().toLowerCase().replace('_', ' ')
            )
        );
    }
}
