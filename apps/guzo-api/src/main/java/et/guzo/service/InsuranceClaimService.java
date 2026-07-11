package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.InsuranceClaim;
import et.guzo.domain.entity.Order;
import et.guzo.domain.enums.InsuranceClaimStatus;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.InsuranceClaimRepository;
import et.guzo.repository.OrderRepository;
import et.guzo.util.IdUtil;
import et.guzo.util.PageQuery;
import et.guzo.web.dto.InsuranceClaimCreateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InsuranceClaimService {

    private final InsuranceClaimRepository insuranceClaimRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(int page, int limit, String userId, boolean customerOnly) {
        Page<InsuranceClaim> result;
        if (customerOnly) {
            Customer customer = customerRepository.findByUserId(userId).orElse(null);
            if (customer == null) {
                return Map.of("items", java.util.List.of(), "meta", PaginationMeta.of(page, limit, 0));
            }
            result = insuranceClaimRepository.findByCustomerId(customer.getId(), PageQuery.of(page, limit));
        } else {
            result = insuranceClaimRepository.findAll(PageQuery.of(page, limit));
        }
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional
    public InsuranceClaim create(String userId, InsuranceClaimCreateRequest body) {
        Customer customer = customerRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.badRequest("Customer profile required"));

        Order order = orderRepository.findById(body.orderId())
            .filter(o -> customer.getId().equals(o.getCustomerId()))
            .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!order.isHasInsurance()) {
            throw ApiException.badRequest("Order has no insurance coverage");
        }
        if (insuranceClaimRepository.findByOrderId(order.getId()).isPresent()) {
            throw ApiException.conflict("Claim already submitted for this order");
        }

        BigDecimal amount = body.amountClaimed() != null
            ? body.amountClaimed()
            : (order.getInsuranceAmount() != null ? order.getInsuranceAmount() : BigDecimal.ZERO);

        InsuranceClaim claim = new InsuranceClaim();
        claim.setId(IdUtil.cuid());
        claim.setOrderId(order.getId());
        claim.setCustomerId(customer.getId());
        claim.setStatus(InsuranceClaimStatus.SUBMITTED);
        claim.setDescription(body.description());
        claim.setAmountClaimed(amount);
        return insuranceClaimRepository.save(claim);
    }
}
