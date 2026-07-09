package et.guzo.service.payment;

import et.guzo.common.ApiException;
import et.guzo.domain.enums.PaymentMethod;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentGateway {

    private final Map<PaymentMethod, PaymentProvider> providers;

    public PaymentGateway(List<PaymentProvider> providerList) {
        providers = new EnumMap<>(PaymentMethod.class);
        for (PaymentProvider p : providerList) {
            providers.put(p.method(), p);
        }
    }

    public PaymentProvider resolve(PaymentMethod method) {
        PaymentProvider provider = providers.get(method != null ? method : PaymentMethod.FAKE);
        if (provider == null) {
            throw ApiException.badRequest("Payment method not supported: " + method);
        }
        return provider;
    }
}
