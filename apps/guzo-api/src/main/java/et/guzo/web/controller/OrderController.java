package et.guzo.web.controller;



import et.guzo.common.ApiResponse;

import et.guzo.common.PaginationMeta;

import et.guzo.security.SecurityUtil;

import et.guzo.service.OrderService;

import et.guzo.web.dto.*;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;



import java.util.List;

import java.util.Map;



@RestController

@RequestMapping("/orders")

@RequiredArgsConstructor

public class OrderController {



    private final OrderService orderService;



    @PostMapping("/quote")

    public ApiResponse<PriceBreakdown> quote(@Valid @RequestBody OrderQuoteRequest body) {

        return ApiResponse.ok(orderService.quote(body), "Quote calculated");

    }



    @GetMapping

    public ApiResponse<List<OrderDetailDto>> list(

        @RequestParam(defaultValue = "1") int page,

        @RequestParam(defaultValue = "20") int limit,

        @RequestParam(required = false) String status,

        @RequestParam(required = false) String search,

        @RequestParam(required = false) String scope

    ) {

        var user = SecurityUtil.requireUser();

        Map<String, Object> result = orderService.list(user, page, limit, status, search, scope);

        @SuppressWarnings("unchecked")

        List<OrderDetailDto> items = (List<OrderDetailDto>) result.get("items");

        PaginationMeta meta = (PaginationMeta) result.get("meta");

        return ApiResponse.ok(items, "Orders loaded", meta);

    }



    @PostMapping

    public ApiResponse<OrderDetailDto> create(@Valid @RequestBody OrderCreateRequest body) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.create(body, user.getId()), "Order created");

    }



    @PostMapping("/bulk")

    public ApiResponse<Map<String, Object>> bulk(@Valid @RequestBody BulkOrderRequest body) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.createBulk(body.orders(), user.getId()), "Bulk upload processed");

    }



    @GetMapping("/{id}")

    public ApiResponse<OrderDetailDto> get(@PathVariable String id) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.getById(id, user));

    }



    @GetMapping("/track/{reference}")

    public ApiResponse<OrderDetailDto> track(@PathVariable String reference) {

        return ApiResponse.ok(orderService.track(reference), "Tracking loaded");

    }



    @PatchMapping("/{id}/status")

    public ApiResponse<OrderDetailDto> updateStatus(

        @PathVariable String id,

        @Valid @RequestBody OrderStatusUpdateRequest body

    ) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.updateStatus(id, body, user), "Status updated");

    }



    @PostMapping("/{id}/assign")

    public ApiResponse<OrderDetailDto> assign(

        @PathVariable String id,

        @Valid @RequestBody AssignDriverRequest body

    ) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.assignDriver(id, body, user), "Driver assigned");

    }



    @PostMapping("/{id}/accept")

    public ApiResponse<OrderDetailDto> accept(@PathVariable String id) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.acceptOrder(id, user), "Order accepted");

    }



    @PostMapping("/{id}/cancel")

    public ApiResponse<OrderDetailDto> cancel(@PathVariable String id) {

        var user = SecurityUtil.requireUser();

        return ApiResponse.ok(orderService.cancel(id, user), "Order cancelled");

    }

    @PostMapping("/{id}/pod")
    public ApiResponse<OrderDetailDto> submitPod(
        @PathVariable String id,
        @RequestParam("photo") org.springframework.web.multipart.MultipartFile photo,
        @RequestParam(value = "signature", required = false) org.springframework.web.multipart.MultipartFile signature,
        @RequestParam(value = "recipientName", required = false) String recipientName,
        @RequestParam(value = "note", required = false) String note
    ) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.submitProof(id, user, photo, signature, recipientName, note), "Proof submitted");
    }

    @PostMapping("/{id}/pickup-proof")
    public ApiResponse<OrderDetailDto> submitPickupProof(
        @PathVariable String id,
        @RequestParam("photo") org.springframework.web.multipart.MultipartFile photo,
        @RequestParam(value = "signature", required = false) org.springframework.web.multipart.MultipartFile signature,
        @RequestParam(value = "note", required = false) String note
    ) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.confirmPickupWithProof(id, user, photo, signature, note), "Pickup confirmed");
    }

    @PostMapping("/{id}/branch-handoff")
    public ApiResponse<OrderDetailDto> branchHandoff(@PathVariable String id, @RequestBody BranchHandoffRequest body) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.branchHandoff(id, user, body.branchId(), body.trackingNumber()), "Dropped at branch");
    }

    @PostMapping("/{id}/failed")
    public ApiResponse<OrderDetailDto> markFailed(@PathVariable String id, @RequestBody(required = false) FailedDeliveryRequest body) {
        var user = SecurityUtil.requireUser();
        String note = body != null ? body.note() : null;
        return ApiResponse.ok(orderService.markFailed(id, user, note), "Delivery marked failed");
    }

    @PostMapping("/{id}/reattempt")
    public ApiResponse<OrderDetailDto> reattempt(@PathVariable String id) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.reattemptDelivery(id, user), "Delivery reattempt started");
    }

    @PostMapping("/{id}/scan-pickup")
    public ApiResponse<OrderDetailDto> scanPickup(
        @PathVariable String id,
        @Valid @RequestBody ScanPickupRequest body
    ) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.scanPickup(id, user, body), "Pickup confirmed");
    }

    @PostMapping("/{id}/arrived")
    public ApiResponse<OrderDetailDto> arrived(
        @PathVariable String id,
        @RequestBody(required = false) DriverArrivedRequest body
    ) {
        var user = SecurityUtil.requireUser();
        return ApiResponse.ok(orderService.notifyDriverArrived(id, user, body), "Receiver notified");
    }

}


