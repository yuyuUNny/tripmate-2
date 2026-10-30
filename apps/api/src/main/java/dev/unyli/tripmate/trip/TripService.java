package dev.unyli.tripmate.trip;

import dev.unyli.tripmate.membership.*;
import dev.unyli.tripmate.trip.TripDtos.*;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TripService {
    private final TripRepository trips;
    private final TripMembershipRepository memberships;
    private final TripAccessService access;

    public TripService(TripRepository trips, TripMembershipRepository memberships, TripAccessService access) {
        this.trips = trips;
        this.memberships = memberships;
        this.access = access;
    }

    @Transactional
    public TripResponse create(String subject, CreateTripRequest request) {
        if (request.endDate().isBefore(request.startDate())) throw new InvalidTripException("endDate must be on or after startDate");
        var trip = new Trip(request.name().trim(), "", request.startDate(), request.endDate());
        trips.save(trip);
        memberships.save(new TripMembership(trip, subject, TripRole.OWNER));
        return TripResponse.from(trip, TripRole.OWNER);
    }
    @Transactional(readOnly = true)
    public List<TripResponse> list(String subject) {
        return memberships.findTripsForSubject(subject).stream()
                .map(trip -> TripResponse.from(trip, membershipRole(trip.getId(), subject)))
                .toList();
    }
    @Transactional(readOnly = true)
    public TripResponse get(UUID tripId, String subject) {
        var membership = access.requireMembership(tripId, subject, TripRole.OWNER, TripRole.EDITOR, TripRole.VIEWER);
        return TripResponse.from(findTrip(tripId), membership.getRole());
    }
    @Transactional
    public void delete(UUID tripId, String subject) {
        access.requireMembership(tripId, subject, TripRole.OWNER);
        memberships.deleteAllByTripId(tripId);
        trips.delete(findTrip(tripId));
    }
    @Transactional
    public TripResponse addItineraryItem(UUID tripId, String subject, AddItineraryItemRequest request) {
        if (!request.endAt().isAfter(request.startAt())) throw new InvalidTripException("endAt must be after startAt");
        var membership = access.requireMembership(tripId, subject, TripRole.OWNER, TripRole.EDITOR);
        var trip = findTrip(tripId);
        trip.addItineraryItem(new ItineraryItem(request.title().trim(), request.startAt(), request.endAt(), request.position()));
        return TripResponse.from(trips.save(trip), membership.getRole());
    }
    private TripRole membershipRole(UUID tripId, String subject) {
        return memberships.findByTripIdAndUserSubject(tripId, subject)
                .orElseThrow(() -> new IllegalStateException("Trip membership disappeared during the transaction"))
                .getRole();
    }
    private Trip findTrip(UUID tripId) {
        return trips.findById(tripId).orElseThrow(() -> new TripNotFoundException(tripId));
    }
}
