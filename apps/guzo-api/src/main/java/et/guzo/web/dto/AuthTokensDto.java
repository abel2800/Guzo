package et.guzo.web.dto;

public record AuthTokensDto(String accessToken, String refreshToken, long expiresIn) {}
