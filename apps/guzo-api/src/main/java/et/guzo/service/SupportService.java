package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.common.PaginationMeta;
import et.guzo.domain.entity.SupportTicket;
import et.guzo.domain.entity.TicketMessage;
import et.guzo.domain.entity.User;
import et.guzo.domain.enums.TicketPriority;
import et.guzo.domain.enums.TicketStatus;
import et.guzo.repository.SupportTicketRepository;
import et.guzo.repository.TicketMessageRepository;
import et.guzo.repository.UserRepository;
import et.guzo.security.AuthUser;
import et.guzo.security.RoleChecker;
import et.guzo.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final UserRepository userRepository;

    private boolean isAgent(AuthUser user) {
        return RoleChecker.hasAnyRole(user, "SUPER_ADMIN", "ADMIN", "SUPPORT", "OPERATIONS_MANAGER");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(AuthUser user, int page, int limit, String status, String priority, String search) {
        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicket> result;
        if (!isAgent(user)) {
            result = ticketRepository.findByRequesterId(user.getId(), pageable);
        } else if (search != null && !search.isBlank()) {
            result = ticketRepository.search(search, pageable);
        } else if (status != null && !status.isBlank()) {
            result = ticketRepository.findByStatus(TicketStatus.valueOf(status), pageable);
        } else {
            result = ticketRepository.findAll(pageable);
        }
        List<Map<String, Object>> items = result.getContent().stream().map(t -> toDto(t, user)).toList();
        return Map.of("items", items, "meta", PaginationMeta.of(page, limit, result.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(String id, AuthUser user) {
        SupportTicket ticket = ticketRepository.findById(id).orElseThrow(() -> ApiException.notFound("Ticket not found"));
        assertAccess(ticket, user);
        return toDto(ticket, user, true);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body, AuthUser user) {
        Instant now = Instant.now();
        SupportTicket ticket = new SupportTicket();
        ticket.setId(IdUtil.cuid());
        ticket.setTicketNumber(IdUtil.ticketNumber());
        ticket.setRequesterId(user.getId());
        ticket.setSubject((String) body.get("subject"));
        ticket.setCategory((String) body.get("category"));
        if (body.get("priority") != null) ticket.setPriority(TicketPriority.valueOf(body.get("priority").toString()));
        if (body.get("orderId") != null) ticket.setOrderId(body.get("orderId").toString());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);
        ticketRepository.save(ticket);
        if (body.get("message") != null) {
            addMessage(ticket.getId(), Map.of("body", body.get("message")), user);
        }
        return toDto(ticket, user, true);
    }

    @Transactional
    public Map<String, Object> addMessage(String ticketId, Map<String, Object> body, AuthUser user) {
        SupportTicket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> ApiException.notFound("Ticket not found"));
        assertAccess(ticket, user);
        boolean internal = isAgent(user) && Boolean.TRUE.equals(body.get("isInternal"));
        Instant now = Instant.now();
        TicketMessage msg = new TicketMessage();
        msg.setId(IdUtil.cuid());
        msg.setTicketId(ticketId);
        msg.setAuthorId(user.getId());
        msg.setBody(body.get("body").toString());
        msg.setInternal(internal);
        msg.setCreatedAt(now);
        messageRepository.save(msg);
        if (!internal) {
            if (isAgent(user) && ticket.getStatus() == TicketStatus.OPEN) ticket.setStatus(TicketStatus.IN_PROGRESS);
            if (!isAgent(user) && List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.WAITING_CUSTOMER).contains(ticket.getStatus())) {
                ticket.setStatus(TicketStatus.OPEN);
            }
            ticket.setUpdatedAt(now);
            ticketRepository.save(ticket);
        }
        return Map.of("id", msg.getId(), "body", msg.getBody(), "isInternal", msg.isInternal(), "createdAt", msg.getCreatedAt(),
            "author", person(user.getId()));
    }

    @Transactional
    public Map<String, Object> update(String id, Map<String, Object> body, AuthUser user) {
        if (!isAgent(user)) throw ApiException.forbidden("Agent access required");
        SupportTicket ticket = ticketRepository.findById(id).orElseThrow(() -> ApiException.notFound("Ticket not found"));
        Instant now = Instant.now();
        if (body.get("status") != null) {
            TicketStatus status = TicketStatus.valueOf(body.get("status").toString());
            ticket.setStatus(status);
            ticket.setResolvedAt(status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED ? now : null);
        }
        if (body.get("priority") != null) ticket.setPriority(TicketPriority.valueOf(body.get("priority").toString()));
        if (body.containsKey("assigneeId")) {
            ticket.setAssigneeId(body.get("assigneeId") != null ? body.get("assigneeId").toString() : null);
        }
        if (body.get("category") != null) ticket.setCategory(body.get("category").toString());
        ticket.setUpdatedAt(now);
        ticketRepository.save(ticket);
        return toDto(ticket, user, true);
    }

    private void assertAccess(SupportTicket ticket, AuthUser user) {
        if (!isAgent(user) && !ticket.getRequesterId().equals(user.getId())) {
            throw ApiException.forbidden("Not your ticket");
        }
    }

    private Map<String, Object> toDto(SupportTicket t, AuthUser user) {
        return toDto(t, user, false);
    }

    private Map<String, Object> toDto(SupportTicket t, AuthUser user, boolean withMessages) {
        List<TicketMessage> messages = withMessages ? messageRepository.findByTicketIdOrderByCreatedAtAsc(t.getId()) : List.of();
        List<Map<String, Object>> msgDtos = messages.stream()
            .filter(m -> isAgent(user) || !m.isInternal())
            .map(m -> Map.<String, Object>of(
                "id", m.getId(), "body", m.getBody(), "isInternal", m.isInternal(),
                "createdAt", m.getCreatedAt(), "author", person(m.getAuthorId())
            )).toList();
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", t.getId());
        m.put("ticketNumber", t.getTicketNumber());
        m.put("subject", t.getSubject());
        m.put("category", t.getCategory());
        m.put("status", t.getStatus().name());
        m.put("priority", t.getPriority().name());
        m.put("orderId", t.getOrderId());
        m.put("createdAt", t.getCreatedAt());
        m.put("updatedAt", t.getUpdatedAt());
        m.put("resolvedAt", t.getResolvedAt());
        m.put("requester", person(t.getRequesterId()));
        m.put("assignee", t.getAssigneeId() != null ? person(t.getAssigneeId()) : null);
        m.put("messages", msgDtos);
        return m;
    }

    private Map<String, Object> person(String userId) {
        User u = userRepository.findById(userId).orElse(null);
        if (u == null) return Map.of("id", userId, "firstName", "Unknown", "lastName", "");
        return Map.of("id", u.getId(), "email", u.getEmail(), "firstName", u.getFirstName(), "lastName", u.getLastName());
    }
}
