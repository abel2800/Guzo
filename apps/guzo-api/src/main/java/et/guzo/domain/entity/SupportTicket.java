package et.guzo.domain.entity;

import et.guzo.domain.enums.TicketPriority;
import et.guzo.domain.enums.TicketStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    private String id;

    @Column(name = "ticketNumber", unique = true, nullable = false)
    private String ticketNumber;

    @Column(name = "requesterId", nullable = false)
    private String requesterId;

    @Column(name = "assigneeId")
    private String assigneeId;

    @Column(nullable = false)
    private String subject;

    private String category;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"TicketStatus\"")
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "\"TicketPriority\"")
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "orderId")
    private String orderId;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolvedAt")
    private Instant resolvedAt;
}
