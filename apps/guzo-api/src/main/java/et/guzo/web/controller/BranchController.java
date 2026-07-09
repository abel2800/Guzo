package et.guzo.web.controller;

import et.guzo.common.ApiResponse;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Branch;
import et.guzo.security.RoleChecker;
import et.guzo.security.SecurityUtil;
import et.guzo.service.BranchOpsService;
import et.guzo.service.BranchService;
import et.guzo.web.dto.BranchCreateRequest;
import et.guzo.web.dto.BranchRegisterRequest;
import et.guzo.web.dto.BranchResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;
    private final BranchOpsService branchOpsService;

    @GetMapping
    public ApiResponse<List<BranchResponse>> list(
        @RequestParam(required = false) String city,
        @RequestParam(required = false) Boolean all
    ) {
        List<BranchResponse> items = Boolean.TRUE.equals(all)
            ? branchService.listAll().stream().map(BranchResponse::from).toList()
            : branchService.listActive(city).stream().map(BranchResponse::from).toList();
        return ApiResponse.ok(items, "Branches loaded");
    }

    @GetMapping("/{id}")
    public ApiResponse<BranchResponse> get(@PathVariable String id) {
        return ApiResponse.ok(BranchResponse.from(branchService.getById(id)));
    }

    @PostMapping
    public ApiResponse<BranchResponse> create(@Valid @RequestBody BranchCreateRequest body) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        Branch b = new Branch();
        b.setCode(body.code());
        b.setName(body.name());
        b.setLine1(body.line1());
        b.setCity(body.city());
        b.setState(body.state());
        b.setCountry(body.country() != null ? body.country() : "ET");
        b.setLatitude(body.latitude());
        b.setLongitude(body.longitude());
        b.setPhone(body.phone());
        b.setOpeningHours(body.openingHours());
        b.setQueueLevel(body.queueLevel() != null ? body.queueLevel() : 0);
        b.setWarehouseId(body.warehouseId());
        return ApiResponse.ok(BranchResponse.from(branchService.create(b)), "Branch created");
    }

    @PatchMapping("/{id}")
    public ApiResponse<BranchResponse> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        RoleChecker.requireAdmin(SecurityUtil.requireUser());
        return ApiResponse.ok(BranchResponse.from(branchService.update(id, body)), "Branch updated");
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<Map<String, Object>> stats(@PathVariable String id) {
        return ApiResponse.ok(branchOpsService.stats(id, SecurityUtil.requireUser()));
    }

    @GetMapping("/{id}/inventory")
    public ApiResponse<List<Map<String, Object>>> inventory(
        @PathVariable String id,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(defaultValue = "in-stock") String state
    ) {
        Map<String, Object> result = branchOpsService.listInventory(id, page, limit, state, SecurityUtil.requireUser());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) result.get("items");
        return ApiResponse.ok(items, "Inventory loaded", (PaginationMeta) result.get("meta"));
    }

    @GetMapping("/{id}/shelf/{shelfCode}")
    public ApiResponse<List<Map<String, Object>>> shelfLookup(@PathVariable String id, @PathVariable String shelfCode) {
        return ApiResponse.ok(branchOpsService.lookupShelf(id, shelfCode, SecurityUtil.requireUser()));
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<Map<String, Object>> receive(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(branchOpsService.receive(id, body, SecurityUtil.requireUser()), "Parcel received");
    }

    @PostMapping(value = "/{id}/receive-intake", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> receiveIntake(
        @PathVariable String id,
        @RequestParam String trackingNumber,
        @RequestParam(required = false) String shelfCode,
        @RequestParam(required = false) String zone,
        @RequestParam(required = false) String weightKg,
        @RequestParam(required = false) String description,
        @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        Map<String, String> body = new java.util.HashMap<>();
        body.put("trackingNumber", trackingNumber);
        if (shelfCode != null) body.put("shelfCode", shelfCode);
        if (zone != null) body.put("zone", zone);
        if (weightKg != null) body.put("weightKg", weightKg);
        if (description != null) body.put("description", description);
        return ApiResponse.ok(branchOpsService.receiveIntake(id, body, photo, SecurityUtil.requireUser()), "Parcel received");
    }

    @PostMapping("/{id}/register")
    public ApiResponse<Map<String, Object>> register(@PathVariable String id, @Valid @RequestBody BranchRegisterRequest body) {
        return ApiResponse.ok(branchOpsService.registerParcel(id, body, SecurityUtil.requireUser()), "Parcel registered");
    }

    @GetMapping("/{id}/labels/{tracking}")
    public ApiResponse<Map<String, Object>> label(@PathVariable String id, @PathVariable String tracking) {
        return ApiResponse.ok(branchOpsService.getLabel(id, tracking, SecurityUtil.requireUser()));
    }

    @PostMapping("/{id}/shelf")
    public ApiResponse<Map<String, Object>> assignShelf(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(branchOpsService.assignShelf(id, body, SecurityUtil.requireUser()), "Shelf assigned");
    }

    @PostMapping("/{id}/pickup")
    public ApiResponse<Map<String, Object>> confirmPickup(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(branchOpsService.confirmPickup(id, body, SecurityUtil.requireUser()), "Pickup confirmed");
    }

    @PostMapping("/{id}/exception")
    public ApiResponse<Map<String, Object>> markException(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(branchOpsService.markException(id, body, SecurityUtil.requireUser()), "Exception recorded");
    }
}
