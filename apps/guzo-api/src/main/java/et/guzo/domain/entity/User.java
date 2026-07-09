package et.guzo.domain.entity;

import et.guzo.domain.enums.Gender;
import et.guzo.domain.enums.UserStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "passwordHash", nullable = false)
    private String passwordHash;

    @Column(unique = true)
    private String phone;

    @Column(name = "firstName", nullable = false)
    private String firstName;

    @Column(name = "lastName", nullable = false)
    private String lastName;

    @Column(name = "guzoId", unique = true)
    private String guzoId;

    @Column(name = "avatarFileId")
    private String avatarFileId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"Gender\"")
    private Gender gender = Gender.UNSPECIFIED;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"UserStatus\"")
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "lastLoginAt")
    private Instant lastLoginAt;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
