package et.guzo.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import et.guzo.domain.enums.DeliveryType;
import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PickupMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCreateRequest {
    @NotNull @Valid private AddressInput pickup;
    @NotNull @Valid private AddressInput dropoff;
    private DeliveryType deliveryType;
    private PaymentMethod paymentMethod;
    private PickupMethod pickupMethod;
    private String receiverPhone;
    private String receiverGuzoId;
    private String originBranchId;
    private String destinationBranchId;
    private BigDecimal weightKg;
    private boolean hasInsurance;
    private BigDecimal insuranceAmount;
    private String notes;

    @JsonProperty("package")
    private PackageInput packageInput;

    public BigDecimal resolveWeightKg() {
        if (weightKg != null) return weightKg;
        if (packageInput != null && packageInput.getWeightKg() != null) return packageInput.getWeightKg();
        return BigDecimal.ONE;
    }

    public boolean resolveHasInsurance() {
        return hasInsurance;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PackageInput {
        private String description;
        private BigDecimal weightKg;
        private Boolean isFragile;
    }
}
