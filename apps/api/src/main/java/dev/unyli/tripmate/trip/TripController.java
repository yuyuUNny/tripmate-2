package dev.unyli.tripmate.trip;

import dev.unyli.tripmate.trip.TripDtos.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    private final TripService trips;
    public TripController(TripService trips) { this.trips = trips; }
    @PostMapping
    public ResponseEntity<TripResponse> create(@Valid @RequestBody CreateTripRequest request) {
        var trip = trips.create(request);
        return ResponseEntity.created(URI.create("/api/trips/" + trip.id())).body(trip);
    }
    @GetMapping("/{tripId}")
    public TripResponse get(@PathVariable UUID tripId) { return trips.get(tripId); }
    @PostMapping("/{tripId}/itinerary-items")
    public ResponseEntity<TripResponse> addItem(@PathVariable UUID tripId, @Valid @RequestBody AddItineraryItemRequest request) {
        return ResponseEntity.ok(trips.addItineraryItem(tripId, request));
    }
}
