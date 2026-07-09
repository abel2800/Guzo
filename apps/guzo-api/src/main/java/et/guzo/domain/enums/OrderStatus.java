package et.guzo.domain.enums;

public enum OrderStatus {
    DRAFT,
    PENDING_PAYMENT,
    CONFIRMED,
    ASSIGNED,
    PICKED_UP,
    IN_TRANSIT,
    AT_BRANCH,
    AT_WAREHOUSE,
    AT_DESTINATION_BRANCH,
    READY_FOR_PICKUP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    FAILED,
    CANCELLED,
    RETURNED
}
