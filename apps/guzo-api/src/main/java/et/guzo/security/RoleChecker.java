package et.guzo.security;

import et.guzo.common.ApiException;

import java.util.Arrays;
import java.util.Set;

public final class RoleChecker {
    private static final Set<String> ADMIN_ROLES = Set.of(
        "SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "SUPPORT"
    );
    private static final Set<String> STATUS_ROLES = Set.of(
        "SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "SUPPORT", "DRIVER", "WAREHOUSE_STAFF", "BRANCH_STAFF"
    );

    private static final Set<String> WAREHOUSE_ROLES = Set.of(
        "SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"
    );

    private RoleChecker() {}

    public static boolean hasAnyRole(AuthUser user, String... roles) {
        if (user == null) return false;
        return user.getRoles().stream().anyMatch(r -> Arrays.asList(roles).contains(r));
    }

    public static boolean isAdmin(AuthUser user) {
        if (user == null) return false;
        return user.getRoles().stream().anyMatch(ADMIN_ROLES::contains);
    }

    public static void requireAdmin(AuthUser user) {
        if (!isAdmin(user)) throw ApiException.forbidden("Admin access required");
    }

    public static void requireStatusUpdater(AuthUser user) {
        if (!hasAnyRole(user, STATUS_ROLES.toArray(String[]::new))) {
            throw ApiException.forbidden("Not allowed to update order status");
        }
    }

    public static void requireWarehouse(AuthUser user) {
        if (!isAdmin(user) && !hasAnyRole(user, WAREHOUSE_ROLES.toArray(String[]::new))) {
            throw ApiException.forbidden("Warehouse access required");
        }
    }

    public static void requireWarehouseOrAdmin(AuthUser user) {
        requireWarehouse(user);
    }
}
