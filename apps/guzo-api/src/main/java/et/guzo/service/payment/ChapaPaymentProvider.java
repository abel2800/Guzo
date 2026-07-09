package et.guzo.service.payment;

import et.guzo.domain.enums.PaymentMethod;
import et.guzo.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

@Component
public class ChapaPaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.CHAPA;
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        return new ChargeResult(
            PaymentStatus.PENDING,
            "CHP-" + request.reference(),
            "https://checkout.chapa.co/stub/" + request.reference()
        );
    }
}
