package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Invoice;
import et.guzo.domain.entity.Order;
import et.guzo.domain.enums.InvoiceStatus;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.InvoiceRepository;
import et.guzo.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(String userId, boolean isAdmin, int page, int limit, String status, String search) {
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Invoice> result;
        if (search != null && !search.isBlank()) {
            result = invoiceRepository.search(search, pageable);
        } else if (status != null && !status.isBlank()) {
            result = invoiceRepository.findByStatus(InvoiceStatus.valueOf(status), pageable);
        } else {
            result = invoiceRepository.findAll(pageable);
        }
        if (!isAdmin && userId != null) {
            var customer = customerRepository.findByUserId(userId).orElse(null);
            if (customer != null) {
                List<Invoice> filtered = result.getContent().stream()
                    .filter(inv -> {
                        Order o = orderRepository.findById(inv.getOrderId()).orElse(null);
                        return o != null && customer.getId().equals(o.getCustomerId());
                    }).toList();
                return Map.of("items", filtered.stream().map(this::toDto).toList(),
                    "meta", PaginationMeta.of(page, limit, filtered.size()));
            }
        }
        return Map.of("items", result.getContent().stream().map(this::toDto).toList(),
            "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional
    public Map<String, Object> updateStatus(String id, InvoiceStatus status) {
        Invoice inv = invoiceRepository.findById(id).orElseThrow(() -> ApiException.notFound("Invoice not found"));
        inv.setStatus(status);
        if (status == InvoiceStatus.PAID) inv.setPaidAt(Instant.now());
        inv.setUpdatedAt(Instant.now());
        return toDto(invoiceRepository.save(inv));
    }

    @Transactional
    public Invoice createForOrder(Order order) {
        Instant now = Instant.now();
        Invoice inv = new Invoice();
        inv.setId(et.guzo.util.IdUtil.cuid());
        inv.setInvoiceNumber(et.guzo.util.IdUtil.invoiceNumber());
        inv.setOrderId(order.getId());
        inv.setStatus(order.getStatus() == et.guzo.domain.enums.OrderStatus.PENDING_PAYMENT ? InvoiceStatus.ISSUED : InvoiceStatus.PAID);
        inv.setSubtotal(order.getTotalAmount().subtract(order.getTax()).add(order.getDiscount()));
        inv.setTax(order.getTax());
        inv.setDiscount(order.getDiscount());
        inv.setTotal(order.getTotalAmount());
        inv.setCurrency(order.getCurrency());
        inv.setIssuedAt(now);
        inv.setDueAt(now.plusSeconds(7 * 24 * 3600));
        if (inv.getStatus() == InvoiceStatus.PAID) inv.setPaidAt(now);
        inv.setCreatedAt(now);
        inv.setUpdatedAt(now);
        return invoiceRepository.save(inv);
    }

    private Map<String, Object> toDto(Invoice inv) {
        Order order = orderRepository.findById(inv.getOrderId()).orElse(null);
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", inv.getId());
        m.put("invoiceNumber", inv.getInvoiceNumber());
        m.put("status", inv.getStatus().name());
        m.put("subtotal", inv.getSubtotal());
        m.put("tax", inv.getTax());
        m.put("discount", inv.getDiscount());
        m.put("total", inv.getTotal());
        m.put("currency", inv.getCurrency());
        m.put("issuedAt", inv.getIssuedAt());
        m.put("dueAt", inv.getDueAt());
        m.put("paidAt", inv.getPaidAt());
        m.put("order", order == null ? null : Map.of("id", order.getId(), "orderNumber", order.getOrderNumber()));
        return m;
    }
}
