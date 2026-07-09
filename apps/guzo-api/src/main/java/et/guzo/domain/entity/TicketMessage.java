package et.guzo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "ticket_messages")
public class TicketMessage {

    @Id
    private String id;

    @Column(name = "ticketId", nullable = false)
    private String ticketId;

    @Column(name = "authorId", nullable = false)
    private String authorId;

    @Column(nullable = false)
    private String body;

    @Column(name = "isInternal", nullable = false)
    private boolean internal;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;
}
