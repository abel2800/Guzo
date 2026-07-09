package et.guzo.web.dto;

import et.guzo.domain.entity.User;
import et.guzo.domain.enums.UserStatus;

import java.time.Instant;
import java.util.List;

public record AdminUserDto(
    String id,
    String email,
    String firstName,
    String lastName,
    String phone,
    UserStatus status,
    List<String> roles,
    Instant createdAt
) {
    public static AdminUserDto of(User user, List<String> roles) {
        return new AdminUserDto(
            user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
            user.getPhone(), user.getStatus(), roles, user.getCreatedAt()
        );
    }
}
