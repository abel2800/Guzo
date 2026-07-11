package et.guzo.web.dto;

import et.guzo.domain.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
    @NotNull OrderStatus status,
    String note,
    Double latitude,
    Double longitude
) {
    public OrderStatusUpdateRequest(OrderStatus status, String note) {
        this(status, note, null, null);
    }
}
