package et.guzo.service;

import et.guzo.common.ApiException;
import et.guzo.domain.entity.Package;
import et.guzo.repository.PackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class PickupCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final PackageRepository packageRepository;

    @Transactional
    public Package assignCodes(Package pkg) {
        if (pkg.getPickupPin() == null || pkg.getPickupPin().isBlank()) {
            String pin;
            do {
                pin = String.format("%06d", RANDOM.nextInt(1_000_000));
            } while (packageRepository.findByPickupPin(pin).isPresent());
            pkg.setPickupPin(pin);
        }
        if (pkg.getQrCode() == null || pkg.getQrCode().isBlank()) {
            pkg.setQrCode("GUZO:" + pkg.getTrackingNumber() + ":" + pkg.getPickupPin());
        }
        return packageRepository.save(pkg);
    }

    @Transactional(readOnly = true)
    public Package verifyPickup(String trackingOrQr, String pin) {
        String resolvedPin = pin != null ? pin.trim() : null;
        if ((trackingOrQr == null || trackingOrQr.isBlank()) && resolvedPin != null && !resolvedPin.isBlank()) {
            return packageRepository.findByPickupPin(resolvedPin)
                .orElseThrow(() -> ApiException.notFound("Parcel not found"));
        }

        final String reference;
        final String pinForCheck;
        if (trackingOrQr != null && trackingOrQr.startsWith("GUZO:")) {
            String[] parts = trackingOrQr.split(":");
            if (parts.length >= 3) {
                reference = parts[1];
                pinForCheck = parts[2];
            } else {
                reference = trackingOrQr;
                pinForCheck = resolvedPin;
            }
        } else {
            reference = trackingOrQr;
            pinForCheck = resolvedPin;
        }
        Package pkg = packageRepository.findByTrackingNumber(reference)
            .or(() -> packageRepository.findByPickupPin(pinForCheck))
            .orElseThrow(() -> ApiException.notFound("Parcel not found"));
        if (pinForCheck != null && pkg.getPickupPin() != null && !pkg.getPickupPin().equals(pinForCheck)) {
            throw ApiException.badRequest("Invalid pickup PIN");
        }
        return pkg;
    }
}
