package et.guzo.service;

import et.guzo.domain.entity.ActivityLog;
import et.guzo.repository.ActivityLogRepository;
import et.guzo.util.IdUtil;
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
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void write(String userId, String action, Map<String, Object> metadata) {
        ActivityLog log = new ActivityLog();
        log.setId(IdUtil.cuid());
        log.setUserId(userId);
        log.setAction(action);
        log.setMetadata(metadata);
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(int page, int limit) {
        Page<ActivityLog> result = activityLogRepository.findAll(PageQuery.of(page, limit));
        List<Map<String, Object>> items = result.getContent().stream().map(this::toDto).toList();
        return Map.of("items", items, "meta", et.guzo.common.PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    private Map<String, Object> toDto(ActivityLog log) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", log.getId());
        dto.put("userId", log.getUserId());
        dto.put("action", log.getAction());
        dto.put("metadata", log.getMetadata());
        dto.put("ipAddress", log.getIpAddress());
        dto.put("createdAt", log.getCreatedAt());
        return dto;
    }
}
