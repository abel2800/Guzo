package et.guzo.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtil {
    private SecurityUtil() {}

    public static AuthUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUser user)) {
            return null;
        }
        return user;
    }

    public static AuthUser requireUser() {
        AuthUser user = currentUser();
        if (user == null) {
            throw et.guzo.common.ApiException.unauthorized("Authentication required");
        }
        return user;
    }
}
