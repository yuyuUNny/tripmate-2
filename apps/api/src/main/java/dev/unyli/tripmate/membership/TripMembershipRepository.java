package dev.unyli.tripmate.membership;

import dev.unyli.tripmate.trip.Trip;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TripMembershipRepository extends JpaRepository<TripMembership, UUID> {
    Optional<TripMembership> findByTripIdAndUserSubject(UUID tripId, String userSubject);
    List<TripMembership> findAllByTripIdOrderByCreatedAt(UUID tripId);
    void deleteAllByTripId(UUID tripId);

    @Query("select membership.trip from TripMembership membership "
            + "where membership.userSubject = :subject order by membership.trip.createdAt desc")
    List<Trip> findTripsForSubject(@Param("subject") String subject);
}
