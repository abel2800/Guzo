package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class CbePaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.CBE;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(
            PaymentStatus.PENDING,
            "CBE-" + request.reference(),
            "https://cbe.stub/checkout?ref=" + request.reference()
        );
    }
}
