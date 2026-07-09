package et.guzo.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String key;

    private String description;
    private String resource;
    private String action;
}
