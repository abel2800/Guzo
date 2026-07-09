package et.guzo.repository;

import et.guzo.domain.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingRuleRepository extends JpaRepository<PricingRule, String> {
}
