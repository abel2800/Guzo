package et.guzo.web.dto;

import java.util.List;

public record MapRouteResult(
    double distanceKm,
    double durationMin,
    List<double[]> coordinates,
    String source
) {}
