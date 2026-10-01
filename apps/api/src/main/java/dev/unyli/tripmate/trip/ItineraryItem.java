package dev.unyli.tripmate.trip;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "itinerary_items")
public class ItineraryItem {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;
    @Column(nullable = false, length = 160) private String title;
    @Column(name = "start_at", nullable = false) private OffsetDateTime startAt;
    @Column(name = "end_at", nullable = false) private OffsetDateTime endAt;
    @Column(nullable = false) private int position;
    @Version @Column(nullable = false) private long version;

    protected ItineraryItem() {}
    public ItineraryItem(String title, OffsetDateTime startAt, OffsetDateTime endAt, int position) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.position = position;
    }
    void attachTo(Trip trip) { this.trip = trip; }
    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public OffsetDateTime getStartAt() { return startAt; }
    public OffsetDateTime getEndAt() { return endAt; }
    public int getPosition() { return position; }
    public long getVersion() { return version; }
}
