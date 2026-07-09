package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class CardPaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.CARD;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(
            PaymentStatus.PENDING,
            "CARD-" + request.reference(),
            "https://payments.stub/card?ref=" + request.reference()
        );
    }
}
