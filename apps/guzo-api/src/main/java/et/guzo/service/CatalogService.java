package et.guzo.service;

import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.Coupon;
import et.guzo.domain.entity.Merchant;
import et.guzo.domain.entity.Permission;
import et.guzo.domain.entity.PricingRule;
import et.guzo.domain.entity.Vehicle;
import et.guzo.repository.CouponRepository;
import et.guzo.repository.CustomerRepository;
import et.guzo.repository.MerchantRepository;
import et.guzo.repository.PermissionRepository;
import et.guzo.repository.PricingRuleRepository;
import et.guzo.repository.UserRepository;
import et.guzo.repository.VehicleRepository;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final MerchantRepository merchantRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final CouponRepository couponRepository;
    private final VehicleRepository vehicleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> listMerchants(int page, int limit) {
        Page<Merchant> result = merchantRepository.findAll(PageQuery.of(page, limit));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listCustomers(int page, int limit) {
        Page<et.guzo.domain.entity.Customer> result = customerRepository.findAll(PageQuery.of(page, limit));
        List<Map<String, Object>> items = result.getContent().stream().map(c -> {
            var user = userRepository.findById(c.getUserId()).orElse(null);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", c.getId());
            row.put("customerCode", c.getCustomerCode());
            row.put("loyaltyPoints", c.getLoyaltyPoints());
            row.put("referralCode", c.getReferralCode());
            if (user != null) {
                row.put("email", user.getEmail());
                row.put("firstName", user.getFirstName());
                row.put("lastName", user.getLastName());
            }
            return row;
        }).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPricing(int page, int limit) {
        Page<PricingRule> result = pricingRuleRepository.findAll(PageQuery.of(page, limit));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listCoupons(int page, int limit) {
        Page<Coupon> result = couponRepository.findAll(PageQuery.of(page, limit));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listVehicles(int page, int limit) {
        Page<Vehicle> result = vehicleRepository.findAll(PageQuery.of(page, limit));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPermissions(int page, int limit) {
        Page<Permission> result = permissionRepository.findAll(PageQuery.of(page, limit, "key", org.springframework.data.domain.Sort.Direction.ASC));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }
}
