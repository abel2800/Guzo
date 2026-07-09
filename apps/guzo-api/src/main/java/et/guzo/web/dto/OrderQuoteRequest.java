package et.guzo.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import et.guzo.domain.enums.DeliveryType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderQuoteRequest {
    @NotNull @Valid private AddressInput pickup;
    @NotNull @Valid private AddressInput dropoff;
    private DeliveryType deliveryType;
    private BigDecimal weightKg;
    private boolean hasInsurance;
    private BigDecimal insuranceAmount;

    @JsonProperty("package")
    private OrderCreateRequest.PackageInput packageInput;

    public BigDecimal resolveWeightKg() {
        if (weightKg != null) return weightKg;
        if (packageInput != null && packageInput.getWeightKg() != null) return packageInput.getWeightKg();
        return BigDecimal.ONE;
    }
}
