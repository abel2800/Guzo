package et.guzo.web.dto;

import java.time.Instant;

public record NotificationDto(
    String id,
    String title,
    String body,
    String type,
    String status,
    Instant readAt,
    Instant createdAt
) {}
