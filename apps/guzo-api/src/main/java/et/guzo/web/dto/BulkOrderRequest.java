package et.guzo.web.dto;

import java.util.List;

public record BulkOrderRequest(List<OrderCreateRequest> orders) {}
