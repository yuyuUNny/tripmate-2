package dev.unyli.tripmate.membership;

import dev.unyli.tripmate.trip.Trip;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "trip_memberships",
        uniqueConstraints = @UniqueConstraint(name = "uq_trip_membership", columnNames = {"trip_id", "user_subject"}))
public class TripMembership {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;
    @Column(name = "user_subject", nullable = false, length = 200)
    private String userSubject;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripRole role;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TripMembership() {}

    public TripMembership(Trip trip, String userSubject, TripRole role) {
        this.id = UUID.randomUUID();
        this.trip = trip;
        this.userSubject = userSubject;
        this.role = role;
        this.createdAt = Instant.now();
    }

    public void changeRole(TripRole role) { this.role = role; }
    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public String getUserSubject() { return userSubject; }
    public TripRole getRole() { return role; }
    public Instant getCreatedAt() { return createdAt; }
}
