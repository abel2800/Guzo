package et.guzo.web.dto;

public record ForgotPasswordRequest(
    String email,
    String phone
) {}
