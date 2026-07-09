package et.guzo.util;

import java.security.SecureRandom;
import java.time.Year;
import java.util.UUID;

public final class IdUtil {
    private static final SecureRandom RANDOM = new SecureRandom();

    private IdUtil() {}

    public static String cuid() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }

    public static String orderNumber() {
        return "ORD-" + Year.now().getValue() + "-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public static String trackingNumber() {
        return "TRK-" + randomAlphaNum(10);
    }

    public static String invoiceNumber() {
        return "INV-" + Year.now().getValue() + "-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public static String paymentReference() {
        return "PAY-" + randomAlphaNum(8);
    }

    public static String customerCode() {
        return "CUST-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public static String merchantCode() {
        return "MER-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public static String driverCode() {
        return "DRV-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    public static String ticketNumber() {
        return "TIC-" + String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static String randomAlphaNum(int len) {
        final char[] chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(chars[RANDOM.nextInt(chars.length)]);
        return sb.toString();
    }
}
