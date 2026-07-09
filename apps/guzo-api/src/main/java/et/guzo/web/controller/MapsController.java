package et.guzo.web.controller;



import et.guzo.common.ApiResponse;

import et.guzo.service.MapsService;

import et.guzo.web.dto.AddressInput;

import et.guzo.web.dto.GeocodeResult;

import et.guzo.web.dto.MapRouteResult;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;



import java.util.ArrayList;

import java.util.List;



@RestController

@RequestMapping("/maps")

@RequiredArgsConstructor

public class MapsController {



    private final MapsService mapsService;



    @GetMapping("/geocode")

    public ApiResponse<GeocodeResult> geocode(

        @RequestParam(required = false) String q,

        @RequestParam(required = false) String line1,

        @RequestParam(required = false) String city,

        @RequestParam(defaultValue = "ET") String country

    ) {

        if (q != null && !q.isBlank()) {

            return ApiResponse.ok(mapsService.geocodeQuery(q));

        }

        var coords = mapsService.geocode(new AddressInput(
            line1 != null ? line1 : "", null, city != null ? city : "", null, country,
            null, null, null, null, null
        ));

        return ApiResponse.ok(new GeocodeResult(coords.lat(), coords.lng(), line1 + ", " + city));

    }



    @GetMapping("/route")

    public ApiResponse<MapRouteResult> route(

        @RequestParam double fromLat,

        @RequestParam double fromLng,

        @RequestParam double toLat,

        @RequestParam double toLng,

        @RequestParam(required = false) String via

    ) {

        List<MapsService.LatLng> waypoints = parseVia(via);

        return ApiResponse.ok(mapsService.route(

            new MapsService.LatLng(fromLat, fromLng),

            waypoints,

            new MapsService.LatLng(toLat, toLng)

        ));

    }



    private static List<MapsService.LatLng> parseVia(String via) {

        if (via == null || via.isBlank()) return List.of();

        List<MapsService.LatLng> points = new ArrayList<>();

        for (String segment : via.split(";")) {

            String[] parts = segment.split(",");

            if (parts.length == 2) {

                points.add(new MapsService.LatLng(Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim())));

            }

        }

        return points;

    }

}


