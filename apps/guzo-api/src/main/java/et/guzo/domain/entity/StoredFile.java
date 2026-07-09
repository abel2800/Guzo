package et.guzo.domain.entity;

import et.guzo.domain.enums.FileCategory;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "files")
public class StoredFile {

    @Id
    private String id;

    @Column(name = "uploaderId")
    private String uploaderId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"FileCategory\"")
    private FileCategory category = FileCategory.OTHER;

    @Column(name = "originalName", nullable = false)
    private String originalName;

    @Column(name = "storedName", nullable = false)
    private String storedName;

    @Column(name = "mimeType", nullable = false)
    private String mimeType;

    @Column(name = "sizeBytes", nullable = false)
    private int sizeBytes;

    @Column(name = "storageKey", nullable = false)
    private String storageKey;

    @Column(name = "storageDriver", nullable = false)
    private String storageDriver = "local";

    @Column(name = "packageId")
    private String packageId;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
