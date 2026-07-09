package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Invoice;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.Payment;
import et.guzo.domain.enums.InvoiceStatus;
import et.guzo.domain.enums.PaymentStatus;
import et.guzo.repository.InvoiceRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(int page, int limit, String status, String search) {
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Payment> result;
        if (search != null && !search.isBlank()) {
            result = paymentRepository.search(search, pageable);
        } else if (status != null && !status.isBlank()) {
            result = paymentRepository.findByStatus(PaymentStatus.valueOf(status), pageable);
        } else {
            result = paymentRepository.findAll(pageable);
        }
        List<Map<String, Object>> items = result.getContent().stream().map(this::toDto).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional
    public Map<String, Object> refund(String paymentId, RefundRequest dto) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> ApiException.notFound("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PAID && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw ApiException.badRequest("Only paid payments can be refunded");
        }
        BigDecimal total = payment.getAmount();
        BigDecimal already = payment.getRefundedAmount() != null ? payment.getRefundedAmount() : BigDecimal.ZERO;
        BigDecimal remaining = total.subtract(already);
        BigDecimal amount = dto.amount() != null ? dto.amount() : remaining;
        if (amount.compareTo(BigDecimal.ZERO) <= 0 || amount.compareTo(remaining) > 0) {
            throw ApiException.badRequest("Invalid refund amount");
        }
        BigDecimal newRefunded = already.add(amount);
        payment.setRefundedAmount(newRefunded);
        payment.setStatus(newRefunded.compareTo(total) >= 0 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
        payment.setUpdatedAt(Instant.now());
        paymentRepository.save(payment);
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            invoiceRepository.findByOrderId(payment.getOrderId()).ifPresent(inv -> {
                inv.setStatus(InvoiceStatus.VOID);
                inv.setUpdatedAt(Instant.now());
                invoiceRepository.save(inv);
            });
        }
        return toDto(payment);
    }

    private Map<String, Object> toDto(Payment p) {
        Order order = orderRepository.findById(p.getOrderId()).orElse(null);
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", p.getId());
        m.put("reference", p.getReference());
        m.put("provider", p.getProvider());
        m.put("method", p.getMethod().name());
        m.put("status", p.getStatus().name());
        m.put("amount", p.getAmount());
        m.put("currency", p.getCurrency());
        m.put("paidAt", p.getPaidAt());
        m.put("refundedAmount", p.getRefundedAmount() != null ? p.getRefundedAmount() : BigDecimal.ZERO);
        m.put("createdAt", p.getCreatedAt());
        m.put("order", order == null ? null : Map.of(
            "id", order.getId(),
            "orderNumber", order.getOrderNumber(),
            "merchantId", order.getMerchantId() != null ? order.getMerchantId() : ""
        ));
        return m;
    }

    public record RefundRequest(BigDecimal amount, String reason) {}
}
