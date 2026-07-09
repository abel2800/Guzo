package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.CityPricingZone;
import et.guzo.repository.CityPricingZoneRepository;
import et.guzo.util.IdUtil;
import et.guzo.util.PageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CityZoneService {

    private final CityPricingZoneRepository cityPricingZoneRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(int page, int limit, String search) {
        Page<CityPricingZone> result = search != null && !search.isBlank()
            ? cityPricingZoneRepository.findByCityContainingIgnoreCaseOrZoneNameContainingIgnoreCase(
                search.trim(), search.trim(), PageQuery.of(page, limit, "city", org.springframework.data.domain.Sort.Direction.ASC))
            : cityPricingZoneRepository.findAll(PageQuery.of(page, limit, "city", org.springframework.data.domain.Sort.Direction.ASC));
        return Map.of("items", result.getContent(), "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public CityPricingZone getById(String id) {
        return cityPricingZoneRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("City pricing zone not found"));
    }

    @Transactional
    public CityPricingZone create(Map<String, Object> body) {
        String city = String.valueOf(body.get("city")).trim();
        if (cityPricingZoneRepository.findByCityIgnoreCase(city).isPresent()) {
            throw ApiException.conflict("City zone already exists");
        }
        CityPricingZone zone = new CityPricingZone();
        zone.setId(IdUtil.cuid());
        zone.setCity(city);
        zone.setZoneName(String.valueOf(body.get("zoneName")));
        if (body.get("multiplier") != null) {
            zone.setMultiplier(new BigDecimal(body.get("multiplier").toString()));
        }
        if (body.get("isActive") instanceof Boolean active) {
            zone.setActive(active);
        }
        return cityPricingZoneRepository.save(zone);
    }

    @Transactional
    public CityPricingZone update(String id, Map<String, Object> body) {
        CityPricingZone zone = getById(id);
        if (body.containsKey("city")) {
            String city = String.valueOf(body.get("city")).trim();
            cityPricingZoneRepository.findByCityIgnoreCase(city)
                .filter(z -> !z.getId().equals(id))
                .ifPresent(z -> { throw ApiException.conflict("City zone already exists"); });
            zone.setCity(city);
        }
        if (body.containsKey("zoneName")) zone.setZoneName(String.valueOf(body.get("zoneName")));
        if (body.get("multiplier") != null) zone.setMultiplier(new BigDecimal(body.get("multiplier").toString()));
        if (body.get("isActive") instanceof Boolean active) zone.setActive(active);
        return cityPricingZoneRepository.save(zone);
    }

    @Transactional
    public void remove(String id) {
        cityPricingZoneRepository.delete(getById(id));
    }
}
