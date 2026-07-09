package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.*;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.PackageStatus;
import et.guzo.domain.enums.TrackingEventType;
import et.guzo.repository.*;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(int limit) {
        PageRequest pageable = PageRequest.of(0, Math.max(limit, 1), Sort.by("name"));
        return warehouseRepository.findByActiveTrue(pageable).getContent().stream()
            .map(this::toRow).toList();
    }

    private Map<String, Object> toRow(Warehouse w) {
        return Map.of(
            "id", w.getId(), "code", w.getCode(), "name", w.getName(),
            "city", w.getCity(), "capacity", w.getCapacity(), "isActive", w.isActive()
        );
    }
}
