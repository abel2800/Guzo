package et.guzo.service;

import et.guzo.domain.entity.MerchantWebhook;
import et.guzo.domain.entity.Package;
import et.guzo.domain.entity.WebhookDelivery;
import et.guzo.repository.MerchantWebhookRepository;
import et.guzo.repository.PackageRepository;
import et.guzo.repository.WebhookDeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WebhookDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDeliveryService.class);

    private final WebhookDeliveryRepository deliveryRepository;
    private final MerchantWebhookRepository webhookRepository;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void processPending() {
        List<WebhookDelivery> pending = deliveryRepository.findPending("PENDING", "FAILED");
        for (WebhookDelivery delivery : pending) {
            if (delivery.getAttempts() >= 5) continue;
            MerchantWebhook hook = webhookRepository.findById(delivery.getWebhookId()).orElse(null);
            if (hook == null || !hook.isActive()) {
                delivery.setStatus("FAILED");
                delivery.setLastError("Webhook not found or inactive");
                deliveryRepository.save(delivery);
                continue;
            }
            try {
                String signature = sign(hook.getSecret(), delivery.getPayload());
                HttpRequest req = HttpRequest.newBuilder(URI.create(hook.getUrl()))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("X-Guzo-Signature", signature)
                    .header("X-Guzo-Event", delivery.getEventType())
                    .POST(HttpRequest.BodyPublishers.ofString(delivery.getPayload()))
                    .build();
                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                delivery.setAttempts(delivery.getAttempts() + 1);
                if (res.statusCode() >= 200 && res.statusCode() < 300) {
                    delivery.setStatus("DELIVERED");
                    delivery.setDeliveredAt(Instant.now());
                    delivery.setLastError(null);
                } else {
                    delivery.setStatus("FAILED");
                    delivery.setLastError("HTTP " + res.statusCode());
                }
            } catch (Exception e) {
                delivery.setAttempts(delivery.getAttempts() + 1);
                delivery.setStatus("FAILED");
                delivery.setLastError(e.getMessage());
                log.warn("Webhook delivery failed: {}", e.getMessage());
            }
            deliveryRepository.save(delivery);
        }
    }

    private static String sign(String secret, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
