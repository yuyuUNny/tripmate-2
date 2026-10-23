package dev.unyli.tripmate.trip;

import dev.unyli.tripmate.trip.TripDtos.*;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TripService {
    private final TripRepository trips;
    public TripService(TripRepository trips) { this.trips = trips; }

    @Transactional
    public TripResponse create(CreateTripRequest request) {
        if (request.endDate().isBefore(request.startDate())) throw new InvalidTripException("endDate must be on or after startDate");
        var destination = request.destination() == null ? "" : request.destination().trim();
        var trip = new Trip(request.name().trim(), destination, request.startDate(), request.endDate());
        return TripResponse.from(trips.save(trip));
    }
    @Transactional(readOnly = true)
    public List<TripResponse> list() {
        return trips.findAllByOrderByCreatedAtDesc().stream().map(TripResponse::from).toList();
    }
    @Transactional(readOnly = true)
    public TripResponse get(UUID tripId) { return TripResponse.from(findTrip(tripId)); }
    @Transactional
    public void delete(UUID tripId) { trips.delete(findTrip(tripId)); }
    @Transactional
    public TripResponse addItineraryItem(UUID tripId, AddItineraryItemRequest request) {
        if (!request.endAt().isAfter(request.startAt())) throw new InvalidTripException("endAt must be after startAt");
        var trip = findTrip(tripId);
        trip.addItineraryItem(new ItineraryItem(request.title().trim(), request.startAt(), request.endAt(), request.position()));
        return TripResponse.from(trips.save(trip));
    }
    private Trip findTrip(UUID tripId) {
        return trips.findById(tripId).orElseThrow(() -> new TripNotFoundException(tripId));
    }
}
