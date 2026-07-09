package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class FakePaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.FAKE;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(PaymentStatus.PAID, "FAKE-" + request.reference(), null);
    }
}
