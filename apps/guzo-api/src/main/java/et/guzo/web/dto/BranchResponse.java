package et.guzo.web.dto;

import et.guzo.domain.entity.Branch;
import jakarta.validation.constraints.NotBlank;

public record BranchResponse(
    String id, String code, String name, String line1, String city, String state, String country,
    Double latitude, Double longitude, String phone, String openingHours,
    int queueLevel, String warehouseId, boolean active
) {
    public static BranchResponse from(Branch b) {
        return new BranchResponse(b.getId(), b.getCode(), b.getName(), b.getLine1(), b.getCity(),
            b.getState(), b.getCountry(), b.getLatitude(), b.getLongitude(), b.getPhone(),
            b.getOpeningHours(), b.getQueueLevel(), b.getWarehouseId(), b.isActive());
    }
}
