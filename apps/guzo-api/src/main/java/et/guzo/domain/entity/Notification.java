package et.guzo.domain.entity;

import et.guzo.domain.enums.NotificationChannel;
import et.guzo.domain.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"NotificationChannel\"")
    private NotificationChannel channel = NotificationChannel.IN_APP;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"NotificationStatus\"")
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String body;

    @Column(name = "readAt")
    private Instant readAt;

    @Column(name = "sentAt")
    private Instant sentAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
