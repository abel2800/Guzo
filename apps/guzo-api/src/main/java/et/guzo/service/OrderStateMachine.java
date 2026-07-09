package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.enums.OrderStatus;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;


@Service
public class OrderStateMachine {

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(OrderStatus.DRAFT, EnumSet.of(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.PENDING_PAYMENT, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.AT_BRANCH, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.ASSIGNED, OrderStatus.AT_BRANCH, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.ASSIGNED, EnumSet.of(OrderStatus.PICKED_UP, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.PICKED_UP, EnumSet.of(OrderStatus.AT_BRANCH, OrderStatus.IN_TRANSIT, OrderStatus.AT_WAREHOUSE));
        TRANSITIONS.put(OrderStatus.AT_BRANCH, EnumSet.of(OrderStatus.IN_TRANSIT, OrderStatus.AT_WAREHOUSE));
        TRANSITIONS.put(OrderStatus.IN_TRANSIT, EnumSet.of(OrderStatus.AT_WAREHOUSE, OrderStatus.AT_DESTINATION_BRANCH));
        TRANSITIONS.put(OrderStatus.AT_WAREHOUSE, EnumSet.of(OrderStatus.IN_TRANSIT, OrderStatus.AT_DESTINATION_BRANCH, OrderStatus.OUT_FOR_DELIVERY));
        TRANSITIONS.put(OrderStatus.AT_DESTINATION_BRANCH, EnumSet.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY));
        TRANSITIONS.put(OrderStatus.READY_FOR_PICKUP, EnumSet.of(OrderStatus.DELIVERED, OrderStatus.RETURNED));
        TRANSITIONS.put(OrderStatus.OUT_FOR_DELIVERY, EnumSet.of(OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.RETURNED));
        TRANSITIONS.put(OrderStatus.FAILED, EnumSet.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RETURNED, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.RETURNED, EnumSet.noneOf(OrderStatus.class));
    }

    public void assertTransition(OrderStatus from, OrderStatus to) {
        Set<OrderStatus> allowed = TRANSITIONS.getOrDefault(from, EnumSet.noneOf(OrderStatus.class));
        if (!allowed.contains(to)) {
            throw ApiException.badRequest("Illegal status transition: " + from + " → " + to);
        }
    }
}
