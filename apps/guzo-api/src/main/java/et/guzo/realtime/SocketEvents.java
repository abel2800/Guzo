package et.guzo.realtime;


public final class SocketEvents {
    private SocketEvents() {}

    public static final String DRIVER_LOCATION = "driver:location";
    public static final String ORDER_TRACKING = "order:tracking";
    public static final String DRIVER_STATUS = "driver:status";
    public static final String ORDER_STATUS = "order:status";
    public static final String NOTIFICATION_NEW = "notification:new";
    public static final String CHAT_MESSAGE = "chat:message";
    public static final String ADMIN_METRICS = "admin:metrics";

    public static final String ORDER_SUBSCRIBE = "order:subscribe";
    public static final String ORDER_UNSUBSCRIBE = "order:unsubscribe";
}
