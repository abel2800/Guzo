package et.guzo.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileDto(
    String id,
    String email,
    String firstName,
    String lastName,
    String phone,
    String guzoId,
    String gender,
    String avatarUrl,
    List<String> roles,
    List<String> permissions,
    String createdAt,
    AddressSummary defaultAddress,
    java.math.BigDecimal walletBalance,
    String walletCurrency
) {
    public record AddressSummary(
        String id, String label, String line1, String line2, String city, String state,
        String postalCode, String country, boolean isDefault
    ) {}
}
