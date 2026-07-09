package et.guzo.service;

import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Customer;
import et.guzo.domain.entity.InsuranceClaim;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.InsuranceClaimRepository;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class InsuranceClaimService {

    private final InsuranceClaimRepository insuranceClaimRepository;
    private final CustomerRepository customerRepository;

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
}
