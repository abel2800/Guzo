package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "guzo_branch_staff")
@IdClass(BranchStaffId.class)
public class BranchStaff {

    @Id
    @Column(name = "userId")
    private String userId;

    @Id
    @Column(name = "branchId")
    private String branchId;

    @Column(name = "assignedAt", nullable = false)
    private Instant assignedAt;
}
