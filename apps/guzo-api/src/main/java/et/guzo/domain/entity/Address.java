package et.guzo.domain.entity;

import et.guzo.domain.enums.AddressType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "addresses")
public class Address {

    @Id
    private String id;

    @Column(name = "userId")
    private String userId;

    private String label;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"AddressType\"")
    private AddressType type = AddressType.OTHER;

    @Column(name = "contactName")
    private String contactName;

    @Column(name = "contactPhone")
    private String contactPhone;

    @Column(nullable = false)
    private String line1;

    private String line2;

    @Column(nullable = false)
    private String city;

    private String state;

    @Column(nullable = false)
    private String country = "ET";

    @Column(name = "postalCode")
    private String postalCode;

    private Double latitude;

    private Double longitude;

    @Column(name = "isDefault", nullable = false)
    private boolean defaultAddress;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;
}
