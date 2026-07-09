package et.guzo.web.dto;

public record LoginResponse(UserProfileDto user, AuthTokensDto tokens) {}
