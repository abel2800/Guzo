package et.guzo.service;

import et.guzo.domain.enums.DriverApprovalStatus;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.repository.*;
import et.guzo.web.dto.MarketingContactRequest;
import et.guzo.web.dto.MarketingNewsletterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketingService {

    private final PackageRepository packageRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final MerchantRepository merchantRepository;
    private final BranchRepository branchRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public Map<String, Object> publicStats() {
        long packages = packageRepository.count();
        long customers = customerRepository.count();
        long drivers = driverRepository.countByApprovalStatus(DriverApprovalStatus.APPROVED);
        long merchants = merchantRepository.count();
        long branches = branchRepository.countByActiveTrue();
        long cities = branchRepository.findByActiveTrue().stream()
            .map(b -> b.getCity() == null ? "" : b.getCity().trim().toLowerCase())
            .filter(c -> !c.isBlank())
            .distinct()
            .count();
        long inTransit = orderRepository.countByStatusIn(List.of(
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.PICKED_UP,
            OrderStatus.AT_WAREHOUSE
        ));
        long activeDeliveries = deliveryRepository.countByDeliveredAtIsNullAndDriverIdIsNotNull();

        List<Map<String, String>> stats = List.of(
            stat("Packages", packages),
            stat("Customers", customers),
            stat("Drivers", drivers),
            stat("Businesses", merchants),
            stat("Cities", Math.max(cities, 1))
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("stats", stats);
        payload.put("raw", Map.of(
            "packages", packages,
            "customers", customers,
            "drivers", drivers,
            "merchants", merchants,
            "branches", branches,
            "cities", cities,
            "inTransit", inTransit,
            "activeDeliveries", activeDeliveries
        ));
        payload.put("runtime", "Java Spring Boot");
        return payload;
    }

    @Transactional
    public void submitContact(MarketingContactRequest req) {
        activityLogService.write(null, "marketing.contact", Map.of(
            "name", req.name(),
            "email", req.email(),
            "topic", req.topic() == null ? "general" : req.topic(),
            "message", req.message()
        ));
    }

    @Transactional
    public void subscribeNewsletter(MarketingNewsletterRequest req) {
        activityLogService.write(null, "marketing.newsletter", Map.of(
            "email", req.email()
        ));
    }

    private static Map<String, String> stat(String label, long value) {
        return Map.of("label", label, "value", formatCount(value));
    }

    static String formatCount(long n) {
        if (n >= 1_000_000) {
            long m = n / 1_000_000;
            return m + "M+";
        }
        if (n >= 10_000) {
            long k = n / 1_000;
            return k + "K+";
        }
        if (n >= 1_000) {
            return String.format("%.1fK", n / 1000.0).replace(".0K", "K");
        }
        if (n <= 0) {
            return "—";
        }
        return Long.toString(n);
    }
}
