package dev.unyli.tripmate.trip;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "trips")
public class Trip {
    @Id private UUID id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 160) private String destination;
    @Column(name = "start_date", nullable = false) private LocalDate startDate;
    @Column(name = "end_date", nullable = false) private LocalDate endDate;
    @Version @Column(nullable = false) private long version;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC, startAt ASC")
    private List<ItineraryItem> itineraryItems = new ArrayList<>();

    protected Trip() {}
    public Trip(String name, String destination, LocalDate startDate, LocalDate endDate) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = Instant.now();
    }
    public void addItineraryItem(ItineraryItem item) { itineraryItems.add(item); item.attachTo(this); }
    public void updateDates(LocalDate startDate, LocalDate endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDestination() { return destination; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public List<ItineraryItem> getItineraryItems() { return List.copyOf(itineraryItems); }
}
