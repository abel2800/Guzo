package et.guzo.service;

import et.guzo.config.GuzoProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final GuzoProperties properties;
    private final Environment environment;

    public void send(String to, String body) {
        String normalized = normalizePhone(to);
        if (normalized == null || normalized.isBlank()) {
            log.warn("[SMS] skipped — invalid recipient phone");
            return;
        }

        if (shouldLogOnly()) {
            log.info("[SMS:console] to={} body=\"{}\"", normalized, body);
            return;
        }

        String driver = properties.getSms().getDriver();
        if ("twilio".equalsIgnoreCase(driver)) {
            sendTwilio(normalized, body);
            return;
        }

        log.warn("SMS driver \"{}\" not implemented; message dropped.", driver);
    }

    private boolean shouldLogOnly() {
        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
        boolean smsConfigured = !"console".equalsIgnoreCase(properties.getSms().getDriver());
        return isDev && !smsConfigured;
    }

    private void sendTwilio(String to, String body) {
        var twilio = properties.getSms().getTwilio();
        if (twilio.getAccountSid() == null || twilio.getAccountSid().isBlank()
            || twilio.getAuthToken() == null || twilio.getAuthToken().isBlank()
            || twilio.getFromNumber() == null || twilio.getFromNumber().isBlank()) {
            throw new IllegalStateException("Twilio SMS requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER");
        }

        String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilio.getAccountSid() + "/Messages.json";
        String form = "To=" + encode(to)
            + "&From=" + encode(twilio.getFromNumber())
            + "&Body=" + encode(body.length() > 1600 ? body.substring(0, 1600) : body);
        String auth = Base64.getEncoder().encodeToString(
            (twilio.getAccountSid() + ":" + twilio.getAuthToken()).getBytes(StandardCharsets.UTF_8));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();
            HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.error("[SMS:twilio] failed {}: {}", response.statusCode(), response.body());
                throw new IllegalStateException("Twilio SMS failed (" + response.statusCode() + ")");
            }
            log.info("[SMS:twilio] sent to={}", to);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Twilio SMS interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("Twilio SMS failed: " + e.getMessage(), e);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String normalizePhone(String phone) {
        if (phone == null) return null;
        String trimmed = phone.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.startsWith("+")) return trimmed;
        if (trimmed.startsWith("0")) return "+251" + trimmed.substring(1);
        return trimmed;
    }
}
