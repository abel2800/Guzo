package et.guzo.realtime;

public final class SocketRooms {
    private SocketRooms() {}

    public static String user(String userId) {
        return "user:" + userId;
    }

    public static String order(String orderId) {
        return "order:" + orderId;
    }

    public static String driver(String driverId) {
        return "driver:" + driverId;
    }

    public static String admins() {
        return "role:admins";
    }
}
