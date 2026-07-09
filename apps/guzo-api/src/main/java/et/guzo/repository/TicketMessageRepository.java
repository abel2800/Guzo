package et.guzo.repository;

import et.guzo.domain.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, String> {
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(String ticketId);
}
