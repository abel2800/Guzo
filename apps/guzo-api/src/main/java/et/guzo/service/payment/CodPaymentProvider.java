package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class CodPaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.CASH_ON_DELIVERY;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(PaymentStatus.PENDING, "COD-" + request.reference(), null);
    }
}
