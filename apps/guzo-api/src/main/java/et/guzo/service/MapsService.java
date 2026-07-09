package et.guzo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import et.guzo.web.dto.AddressInput;
import et.guzo.web.dto.GeocodeResult;
import et.guzo.web.dto.MapRouteResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MapsService {

    private static final String NOMINATIM = "https://nominatim.openstreetmap.org/search";
    private static final String OSRM = "https://router.project-osrm.org/route/v1/driving";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public record LatLng(double lat, double lng) {}

    public GeocodeResult geocodeQuery(String query) {
        try {
            String url = NOMINATIM + "?format=json&limit=1&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "GuzoAPI/1.0")
                .GET().timeout(Duration.ofSeconds(15)).build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode arr = objectMapper.readTree(res.body());
            if (arr.isArray() && !arr.isEmpty()) {
                JsonNode first = arr.get(0);
                return new GeocodeResult(
                    first.get("lat").asDouble(),
                    first.get("lon").asDouble(),
                    first.path("display_name").asText(query)
                );
            }
        } catch (Exception ignored) {}
        return new GeocodeResult(9.03, 38.74, query);
    }

    public LatLng geocode(AddressInput address) {
        if (address.latitude() != null && address.longitude() != null) {
            return new LatLng(address.latitude(), address.longitude());
        }
        String q = String.join(", ", address.line1(), address.city(),
            address.country() != null ? address.country() : "ET");
        GeocodeResult result = geocodeQuery(q);
        return new LatLng(result.lat(), result.lng());
    }

    public MapRouteResult route(LatLng from, LatLng to) {
        return route(from, List.of(), to);
    }

    public MapRouteResult route(LatLng from, List<LatLng> via, LatLng to) {
        try {
            StringBuilder coordPath = new StringBuilder();
            coordPath.append(from.lng()).append(',').append(from.lat());
            for (LatLng wp : via) {
                coordPath.append(';').append(wp.lng()).append(',').append(wp.lat());
            }
            coordPath.append(';').append(to.lng()).append(',').append(to.lat());
            String url = OSRM + "/" + coordPath + "?overview=full&geometries=geojson";
            HttpRequest req = HttpRequest.newBuilder(URI.create(url)).GET().timeout(Duration.ofSeconds(15)).build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(res.body());
            if (!"Ok".equals(root.path("code").asText())) {
                return fallbackRoute(from, to);
            }
            JsonNode route = root.path("routes").get(0);
            double meters = route.path("distance").asDouble();
            double seconds = route.path("duration").asDouble();
            List<double[]> coords = new ArrayList<>();
            for (JsonNode c : route.path("geometry").path("coordinates")) {
                coords.add(new double[]{c.get(1).asDouble(), c.get(0).asDouble()});
            }
            return new MapRouteResult(meters / 1000.0, seconds / 60.0, coords, "osrm");
        } catch (Exception e) {
            return fallbackRoute(from, to);
        }
    }

    private MapRouteResult fallbackRoute(LatLng from, LatLng to) {
        double km = haversine(from.lat(), from.lng(), to.lat(), to.lng());
        return new MapRouteResult(km, km * 2.5, List.of(
            new double[]{from.lat(), from.lng()},
            new double[]{to.lat(), to.lng()}
        ), "haversine");
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
