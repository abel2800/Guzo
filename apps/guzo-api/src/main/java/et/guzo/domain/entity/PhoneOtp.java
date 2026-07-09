package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_phone_otps")
public class PhoneOtp {

    @Id
    private String id;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String code;

    @Column(name = "expiresAt", nullable = false)
    private Instant expiresAt;

    @Column(name = "verifiedAt")
    private Instant verifiedAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
