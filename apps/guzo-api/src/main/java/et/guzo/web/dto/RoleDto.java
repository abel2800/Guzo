package et.guzo.web.dto;

import et.guzo.domain.entity.Role;

public record RoleDto(String id, String name, String description, boolean isSystem) {
    public static RoleDto from(Role role) {
        return new RoleDto(role.getId(), role.getName(), role.getDescription(), role.isSystem());
    }
}
