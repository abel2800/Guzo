package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.Delivery;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.Review;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.ReviewTargetType;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.DeliveryRepository;
import et.guzo.repository.DriverRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.repository.ReviewRepository;
import et.guzo.util.IdUtil;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final DriverRepository driverRepository;

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

    @Transactional
    public Review createForOrder(String userId, String orderId, int rating, String comment) {
        if (rating < 1 || rating > 5) throw ApiException.badRequest("rating must be 1-5");

        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Customer profile required"));

        Order order = orderRepository.findById(orderId)
            .filter(o -> customer.getId().equals(o.getCustomerId()) && o.getStatus() == OrderStatus.DELIVERED)
            .orElseThrow(() -> ApiException.notFound("Delivered order not found"));

        if (reviewRepository.existsByAuthorIdAndOrderIdAndTargetType(userId, orderId, ReviewTargetType.DRIVER)) {
            throw ApiException.conflict("You already rated this delivery");
        }

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
            .orElseThrow(() -> ApiException.badRequest("No driver assigned to rate"));
        if (delivery.getDriverId() == null) {
            throw ApiException.badRequest("No driver assigned to rate");
        }

        Review review = new Review();
        review.setId(IdUtil.cuid());
        review.setAuthorId(userId);
        review.setTargetType(ReviewTargetType.DRIVER);
        review.setTargetId(delivery.getDriverId());
        review.setOrderId(orderId);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);

        Double avg = reviewRepository.averageRatingByTarget(ReviewTargetType.DRIVER, delivery.getDriverId());
        driverRepository.findById(delivery.getDriverId()).ifPresent(driver -> {
            driver.setRating(BigDecimal.valueOf(avg != null ? avg : 0).setScale(2, RoundingMode.HALF_UP));
            driverRepository.save(driver);
        });

        return review;
    }
}
