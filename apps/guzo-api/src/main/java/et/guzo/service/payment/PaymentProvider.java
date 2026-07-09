package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;

import java.math.BigDecimal;

public interface PaymentProvider {
    PaymentMethod method();

    ChargeResult charge(ChargeRequest request);

    record ChargeRequest(
        BigDecimal amount,
        String currency,
        String reference,
        String description,
        String phone
    ) {}

    record ChargeResult(
        PaymentStatus status,
        String providerRef,
        String redirectUrl
    ) {}
}
