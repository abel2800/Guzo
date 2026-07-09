package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId.class)
public class UserRole {

    @Id
    @Column(name = "userId")
    private String userId;

    @Id
    @Column(name = "roleId")
    private String roleId;

    @Column(name = "assignedAt", nullable = false)
    private Instant assignedAt;
}
