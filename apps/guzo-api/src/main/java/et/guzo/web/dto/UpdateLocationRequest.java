package et.guzo.web.dto;

public record UpdateLocationRequest(
    String label, String line1, String line2, String city, String state, String postalCode, String country
) {}
