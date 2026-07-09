package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.MerchantApiKey;
import et.guzo.domain.entity.MerchantWebhook;
import et.guzo.domain.entity.Order;
import et.guzo.domain.entity.WebhookDelivery;
import et.guzo.repository.*;
import et.guzo.security.TokenHasher;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MerchantPlatformService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final MerchantApiKeyRepository apiKeyRepository;
    private final MerchantWebhookRepository webhookRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listApiKeys(String merchantId) {
        return apiKeyRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(k -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", k.getId());
            row.put("label", k.getLabel());
            row.put("keyPrefix", k.getKeyPrefix());
            row.put("isActive", k.isActive());
            row.put("lastUsedAt", k.getLastUsedAt());
            row.put("createdAt", k.getCreatedAt());
            row.put("expiresAt", k.getExpiresAt());
            return row;
        }).toList();
    }

    @Transactional
    public Map<String, String> createApiKey(String merchantId, String label) {
        String prefix = "gz_" + HexFormat.of().formatHex(randomBytes(4));
        String secret = HexFormat.of().formatHex(randomBytes(16));
        String raw = prefix + "." + secret;

        MerchantApiKey key = new MerchantApiKey();
        key.setId(IdUtil.cuid());
        key.setMerchantId(merchantId);
        key.setLabel(label);
        key.setKeyPrefix(prefix);
        key.setKeyHash(TokenHasher.sha256(raw));
        key.setActive(true);
        key.setCreatedAt(Instant.now());
        apiKeyRepository.save(key);

        return Map.of("apiKey", raw, "keyPrefix", prefix, "id", key.getId());
    }

    @Transactional
    public Map<String, Object> revokeApiKey(String merchantId, String keyId) {
        MerchantApiKey key = apiKeyRepository.findByIdAndMerchantId(keyId, merchantId)
            .orElseThrow(() -> ApiException.notFound("API key not found"));
        key.setActive(false);
        apiKeyRepository.save(key);
        return Map.of("id", key.getId(), "label", key.getLabel(), "keyPrefix", key.getKeyPrefix(), "isActive", key.isActive());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listWebhooks(String merchantId) {
        return webhookRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(w -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", w.getId());
            row.put("url", w.getUrl());
            row.put("events", w.getEvents());
            row.put("isActive", w.isActive());
            row.put("createdAt", w.getCreatedAt());
            return row;
        }).toList();
    }

    @Transactional
    public MerchantWebhook registerWebhook(String merchantId, String url, String secret) {
        if (url == null || url.isBlank()) throw ApiException.badRequest("url is required");
        MerchantWebhook wh = new MerchantWebhook();
        wh.setId("wh_" + HexFormat.of().formatHex(randomBytes(8)));
        wh.setMerchantId(merchantId);
        wh.setUrl(url.trim());
        wh.setSecret(secret != null && !secret.isBlank() ? secret.trim() : HexFormat.of().formatHex(randomBytes(8)));
        wh.setCreatedAt(Instant.now());
        return webhookRepository.save(wh);
    }

    @Transactional
    public void dispatchEvent(String merchantId, String eventType, String payload) {
        List<MerchantWebhook> hooks = webhookRepository.findByMerchantIdAndActiveTrue(merchantId);
        Instant now = Instant.now();
        for (MerchantWebhook hook : hooks) {
            WebhookDelivery d = new WebhookDelivery();
            d.setId(IdUtil.cuid());
            d.setWebhookId(hook.getId());
            d.setEventType(eventType);
            d.setPayload(payload);
            d.setStatus("PENDING");
            d.setAttempts(0);
            d.setCreatedAt(now);
            deliveryRepository.save(d);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listCustomers(String merchantId) {
        List<Order> orders = orderRepository.findByMerchantId(merchantId, PageRequest.of(0, 500)).getContent();
        Map<String, Map<String, Object>> map = new LinkedHashMap<>();

        for (Order order : orders) {
            var dropoff = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
            if (dropoff == null) continue;
            String phone = dropoff.getContactPhone() != null && !dropoff.getContactPhone().isBlank()
                ? dropoff.getContactPhone().trim() : dropoff.getLine1();
            Map<String, Object> existing = map.get(phone);
            if (existing != null) {
                existing.put("orderCount", ((Number) existing.get("orderCount")).intValue() + 1);
                if (order.getCreatedAt().toString().compareTo((String) existing.get("lastOrderAt")) > 0) {
                    existing.put("lastOrderAt", order.getCreatedAt().toString());
                }
            } else {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("contactName", dropoff.getContactName());
                row.put("contactPhone", dropoff.getContactPhone());
                row.put("line1", dropoff.getLine1());
                row.put("city", dropoff.getCity());
                row.put("orderCount", 1);
                row.put("lastOrderAt", order.getCreatedAt().toString());
                map.put(phone, row);
            }
        }

        return map.values().stream()
            .sorted((a, b) -> Integer.compare(
                ((Number) b.get("orderCount")).intValue(),
                ((Number) a.get("orderCount")).intValue()))
            .toList();
    }

    private static byte[] randomBytes(int len) {
        byte[] b = new byte[len];
        RANDOM.nextBytes(b);
        return b;
    }
}
