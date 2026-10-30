package dev.unyli.tripmate.trip;

import dev.unyli.tripmate.trip.TripDtos.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    private final TripService trips;
    public TripController(TripService trips) { this.trips = trips; }
    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_write:trips')")
    public ResponseEntity<TripResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateTripRequest request) {
        var trip = trips.create(jwt.getSubject(), request);
        return ResponseEntity.created(URI.create("/api/trips/" + trip.id())).body(trip);
    }
    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_read:trips')")
    public List<TripResponse> list(@AuthenticationPrincipal Jwt jwt) { return trips.list(jwt.getSubject()); }
    @GetMapping("/{tripId}")
    @PreAuthorize("hasAuthority('SCOPE_read:trips')")
    public TripResponse get(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt) { return trips.get(tripId, jwt.getSubject()); }
    @DeleteMapping("/{tripId}")
    @PreAuthorize("hasAuthority('SCOPE_write:trips')")
    public ResponseEntity<Void> delete(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt) {
        trips.delete(tripId, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{tripId}/dates")
    @PreAuthorize("hasAuthority('SCOPE_write:trips')")
    public TripResponse updateDates(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateTripDatesRequest request) {
        return trips.updateDates(tripId, jwt.getSubject(), request);
    }
    @PatchMapping("/{tripId}/cover")
    @PreAuthorize("hasAuthority('SCOPE_write:trips')")
    public TripResponse updateCover(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateTripCoverRequest request) {
        return trips.updateCover(tripId, jwt.getSubject(), request);
    }
    @PostMapping("/{tripId}/itinerary-items")
    @PreAuthorize("hasAuthority('SCOPE_write:trips')")
    public ResponseEntity<TripResponse> addItem(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddItineraryItemRequest request) {
        return ResponseEntity.ok(trips.addItineraryItem(tripId, jwt.getSubject(), request));
    }
}
