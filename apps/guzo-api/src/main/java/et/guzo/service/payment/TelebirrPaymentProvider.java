package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;


@Component
public class TelebirrPaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.TELEBIRR;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(
            PaymentStatus.PENDING,
            "TBR-" + request.reference(),
            "https://telebirr.stub/checkout?ref=" + request.reference()
        );
    }
}
