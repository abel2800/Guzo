package et.guzo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "guzo")
public class GuzoProperties {
    private String corsOrigins;
    private String uploadDir = "./uploads";
    private Socket socket = new Socket();
    private int socketPort = 4001;
    private Jwt jwt = new Jwt();

    @Getter
    @Setter
    public static class Socket {
        private boolean enabled = true;
    }

    @Getter
    @Setter
    public static class Jwt {
        private String accessSecret;
        private String refreshSecret;
        private int accessExpiresMinutes = 15;
        private int refreshExpiresDays = 7;
    }
}
