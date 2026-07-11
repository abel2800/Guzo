package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.PushDevice;
import et.guzo.repository.PushDeviceRepository;
import et.guzo.util.IdUtil;
import et.guzo.web.dto.PushTokenRegisterRequest;
import et.guzo.web.dto.PushTokenRemoveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PushTokenService {

    private static final Set<String> PLATFORMS = Set.of("ios", "android");
    private static final Set<String> APP_SLUGS = Set.of("customer", "driver", "merchant");

    private final PushDeviceRepository pushDeviceRepository;

    @Transactional
    public PushDevice register(String userId, PushTokenRegisterRequest body) {
        String platform = body.platform().trim().toLowerCase();
        String appSlug = body.appSlug().trim().toLowerCase();
        if (!PLATFORMS.contains(platform)) throw ApiException.badRequest("Invalid platform");
        if (!APP_SLUGS.contains(appSlug)) throw ApiException.badRequest("Invalid appSlug");

        String token = body.token().trim();
        Instant now = Instant.now();
        PushDevice device = pushDeviceRepository.findByToken(token).orElse(null);
        if (device == null) {
            device = new PushDevice();
            device.setId(IdUtil.cuid());
            device.setToken(token);
            device.setCreatedAt(now);
        }
        device.setUserId(userId);
        device.setPlatform(platform);
        device.setAppSlug(appSlug);
        device.setUpdatedAt(now);
        return pushDeviceRepository.save(device);
    }

    @Transactional
    public void remove(String userId, PushTokenRemoveRequest body) {
        pushDeviceRepository.deleteByTokenAndUserId(body.token().trim(), userId);
    }
}
