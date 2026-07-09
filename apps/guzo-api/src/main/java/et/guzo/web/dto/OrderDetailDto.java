package et.guzo.web.dto;

import et.guzo.domain.enums.DeliveryType;
import et.guzo.domain.enums.OrderStatus;
import et.guzo.domain.enums.PickupMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDetailDto(
    String id,
    String orderNumber,
    OrderStatus status,
    DeliveryType deliveryType,
    PickupMethod pickupMethod,
    BigDecimal distanceKm,
    BigDecimal totalAmount,
    String currency,
    Instant createdAt,
    Instant estimatedDeliveryAt,
    String receiverGuzoId,
    String receiverPhone,
    String originBranchId,
    String destinationBranchId,
    AddressDto pickupAddress,
    AddressDto dropoffAddress,
    List<PackageDto> packages,
    List<TrackingEventDto> trackingEvents,
    PaymentSummaryDto payment,
    InvoiceSummaryDto invoice,
    CustomerSummaryDto customer,
    DeliverySummaryDto delivery,
    PriceBreakdown pricing
) {
    public record AddressDto(
        String id, String line1, String line2, String city, String state, String country,
        Double latitude, Double longitude, String contactName, String contactPhone
    ) {}

    public record PackageDto(
        String id, String trackingNumber, BigDecimal weightKg, String description,
        String pickupPin, String qrCode
    ) {}

    public record TrackingEventDto(
        String id, String type, String status, String description,
        Double latitude, Double longitude, Instant createdAt
    ) {}

    public record PaymentSummaryDto(String status, BigDecimal amount, String currency, String redirectUrl) {}

    public record InvoiceSummaryDto(String invoiceNumber, String status, BigDecimal total) {}

    public record CustomerSummaryDto(String id, UserSummaryDto user) {
        public record UserSummaryDto(String firstName, String lastName, String phone) {}
    }

    public record DeliverySummaryDto(
        String id, String driverId, String recipientName, Instant deliveredAt, DriverSummaryDto driver
    ) {
        public record DriverSummaryDto(
            String id, Double currentLat, Double currentLng, UserSummaryDto user
        ) {
            public record UserSummaryDto(String firstName, String lastName, String phone) {}
        }
    }
}
