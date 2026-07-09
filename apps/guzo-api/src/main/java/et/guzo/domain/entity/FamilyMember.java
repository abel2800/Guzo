package et.guzo.domain.entity;

import et.guzo.domain.enums.FamilyRelation;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_family_members")
public class FamilyMember {

    @Id
    private String id;

    @Column(name = "ownerUserId", nullable = false)
    private String ownerUserId;

    @Column(name = "memberUserId", nullable = false)
    private String memberUserId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"FamilyRelation\"")
    private FamilyRelation relation = FamilyRelation.OTHER;

    private String label;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;
}
