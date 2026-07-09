package et.guzo.service;



import et.guzo.common.ApiException;

import et.guzo.common.PaginationMeta;

import et.guzo.domain.entity.Notification;
import et.guzo.domain.enums.NotificationChannel;
import et.guzo.domain.enums.NotificationStatus;
import et.guzo.realtime.SocketEvents;
import et.guzo.realtime.SocketRealtimeService;
import et.guzo.repository.NotificationRepository;

import et.guzo.util.IdUtil;

import et.guzo.web.dto.NotificationDto;

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

public class NotificationService {



    private final NotificationRepository notificationRepository;
    private final SocketRealtimeService socketRealtimeService;



    @Transactional

    public Notification notify(String userId, String type, String title, String body) {

        Instant now = Instant.now();

        Notification n = new Notification();

        n.setId(IdUtil.cuid());

        n.setUserId(userId);

        n.setChannel(NotificationChannel.IN_APP);

        n.setStatus(NotificationStatus.SENT);

        n.setType(type);

        n.setTitle(title);

        n.setBody(body);

        n.setSentAt(now);

        n.setCreatedAt(now);

        Notification saved = notificationRepository.save(n);
        socketRealtimeService.emitToUser(userId, SocketEvents.NOTIFICATION_NEW, toDto(saved));
        return saved;

    }



    @Transactional(readOnly = true)

    public List<Notification> listForUser(String userId) {

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

    }



    @Transactional(readOnly = true)

    public Map<String, Object> listPaginated(String userId, int page, int limit, boolean unreadOnly) {

        PageRequest pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Notification> result = unreadOnly

            ? notificationRepository.findByUserIdAndReadAtIsNull(userId, pageable)

            : notificationRepository.findByUserId(userId, pageable);

        long unreadCount = notificationRepository.countByUserIdAndReadAtIsNull(userId);

        List<NotificationDto> items = result.getContent().stream().map(this::toDto).toList();

        PaginationMeta meta = PaginationMeta.of(page, limit, result.getTotalElements(), unreadCount);

        return Map.of("items", items, "meta", meta);

    }



    @Transactional

    public NotificationDto markRead(String userId, String notificationId) {

        Notification n = notificationRepository.findById(notificationId)

            .orElseThrow(() -> ApiException.notFound("Notification not found"));

        if (!n.getUserId().equals(userId)) throw ApiException.forbidden("Not your notification");

        n.setReadAt(Instant.now());

        n.setStatus(NotificationStatus.READ);

        return toDto(notificationRepository.save(n));

    }



    @Transactional

    public int markAllRead(String userId) {

        List<Notification> unread = notificationRepository.findByUserIdAndReadAtIsNull(userId);

        Instant now = Instant.now();

        for (Notification n : unread) {

            n.setReadAt(now);

            n.setStatus(NotificationStatus.READ);

        }

        notificationRepository.saveAll(unread);

        return unread.size();

    }



    private NotificationDto toDto(Notification n) {

        return new NotificationDto(

            n.getId(), n.getTitle(), n.getBody(), n.getType(),

            n.getReadAt() == null ? "UNREAD" : "READ",

            n.getReadAt(), n.getCreatedAt()

        );

    }

}


