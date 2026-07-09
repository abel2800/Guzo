package et.guzo.domain.entity;

import et.guzo.domain.enums.ReviewTargetType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    private String id;

    @Column(name = "authorId", nullable = false)
    private String authorId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "targetType", nullable = false, columnDefinition = "\"ReviewTargetType\"")
    private ReviewTargetType targetType;

    @Column(name = "targetId", nullable = false)
    private String targetId;

    @Column(name = "orderId")
    private String orderId;

    @Column(nullable = false)
    private int rating;

    private String comment;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private Instant updatedAt;
}
