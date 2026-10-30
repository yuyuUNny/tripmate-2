package dev.unyli.tripmate.membership;

import dev.unyli.tripmate.trip.TripNotFoundException;
import dev.unyli.tripmate.trip.TripRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TripMembershipService {
    private final TripRepository trips;
    private final TripMembershipRepository memberships;
    private final TripAccessService access;

    public TripMembershipService(TripRepository trips, TripMembershipRepository memberships, TripAccessService access) {
        this.trips = trips;
        this.memberships = memberships;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<TripMembership> list(UUID tripId, String requesterSubject) {
        access.requireMembership(tripId, requesterSubject, TripRole.OWNER, TripRole.EDITOR, TripRole.VIEWER);
        return memberships.findAllByTripIdOrderByCreatedAt(tripId);
    }

    @Transactional
    public TripMembership addOrUpdate(UUID tripId, String requesterSubject, String memberSubject, TripRole role) {
        access.requireMembership(tripId, requesterSubject, TripRole.OWNER);
        if (role == TripRole.OWNER) {
            throw new InvalidMembershipException("Ownership transfer requires a dedicated workflow");
        }
        var existing = memberships.findByTripIdAndUserSubject(tripId, memberSubject);
        if (existing.isPresent()) {
            if (existing.get().getRole() == TripRole.OWNER) {
                throw new InvalidMembershipException("The trip owner cannot be changed through collaborator management");
            }
            existing.get().changeRole(role);
            return existing.get();
        }
        var trip = trips.findById(tripId).orElseThrow(() -> new TripNotFoundException(tripId));
        return memberships.save(new TripMembership(trip, memberSubject, role));
    }

    @Transactional
    public void remove(UUID tripId, String requesterSubject, String memberSubject) {
        access.requireMembership(tripId, requesterSubject, TripRole.OWNER);
        var membership = memberships.findByTripIdAndUserSubject(tripId, memberSubject)
                .orElseThrow(() -> new InvalidMembershipException("Collaborator is not a member of this trip"));
        if (membership.getRole() == TripRole.OWNER) {
            throw new InvalidMembershipException("The trip owner cannot be removed");
        }
        memberships.delete(membership);
    }
}
