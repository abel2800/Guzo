package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "roles")
public class Role {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Column(name = "isSystem", nullable = false)
    private boolean system;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
