package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "push_devices")
public class PushDevice {

    @Id
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String platform;

    @Column(name = "appSlug", nullable = false)
    private String appSlug;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
