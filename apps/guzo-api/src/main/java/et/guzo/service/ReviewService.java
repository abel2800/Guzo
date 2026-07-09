package et.guzo.service;

import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.Review;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.repository.ReviewRepository;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(int page, int limit) {
        Page<Review> result = reviewRepository.findAllByOrderByCreatedAtDesc(PageQuery.of(page, limit));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> pendingForCustomer(String userId) {
        Customer customer = customerRepository.findByUserId(userId).orElse(null);
        if (customer == null) return List.of();

        List<Order> orders = orderRepository.findByCustomerIdAndStatus(
            customer.getId(), OrderStatus.DELIVERED, PageRequest.of(0, 20)
        ).getContent();

        Set<String> reviewed = reviewRepository.findByAuthorIdAndOrderIdIn(
            userId, orders.stream().map(Order::getId).toList()
        ).stream().map(Review::getOrderId).collect(Collectors.toSet());

        return orders.stream()
            .filter(o -> !reviewed.contains(o.getId()))
            .map(o -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", o.getId());
                row.put("orderNumber", o.getOrderNumber());
                return row;
            })
            .toList();
    }
}
