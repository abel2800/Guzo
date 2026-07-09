package et.guzo.repository;

import et.guzo.domain.entity.SupportTicket;
import et.guzo.domain.enums.TicketPriority;
import et.guzo.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    Page<SupportTicket> findByRequesterId(String requesterId, Pageable pageable);

    Page<SupportTicket> findByStatus(TicketStatus status, Pageable pageable);

    Page<SupportTicket> findByRequesterIdAndStatus(String requesterId, TicketStatus status, Pageable pageable);

    long countByStatus(TicketStatus status);

    @Query("SELECT t FROM SupportTicket t WHERE LOWER(t.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<SupportTicket> search(@Param("search") String search, Pageable pageable);

    long countByRequesterIdAndStatusIn(String requesterId, Iterable<TicketStatus> statuses);

    List<SupportTicket> findByStatusInAndPriorityInOrderByCreatedAtDesc(
        List<TicketStatus> statuses, List<TicketPriority> priorities, Pageable pageable);
}
