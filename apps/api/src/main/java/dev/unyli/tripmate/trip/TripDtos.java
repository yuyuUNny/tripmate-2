package dev.unyli.tripmate.trip;

import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;

final class TripDtos {
    private TripDtos() {}
    record CreateTripRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 160) String destination,
            @NotNull @FutureOrPresent LocalDate startDate,
            @NotNull LocalDate endDate) {}
    record AddItineraryItemRequest(
            @NotBlank @Size(max = 160) String title,
            @NotNull OffsetDateTime startAt,
            @NotNull OffsetDateTime endAt,
            @PositiveOrZero int position) {}
    record ItineraryItemResponse(UUID id, String title, OffsetDateTime startAt, OffsetDateTime endAt, int position, long version) {
        static ItineraryItemResponse from(ItineraryItem item) {
            return new ItineraryItemResponse(item.getId(), item.getTitle(), item.getStartAt(), item.getEndAt(), item.getPosition(), item.getVersion());
        }
    }
    record TripResponse(UUID id, String name, String destination, LocalDate startDate, LocalDate endDate, long version, Instant createdAt, List<ItineraryItemResponse> itineraryItems) {
        static TripResponse from(Trip trip) {
            var items = trip.getItineraryItems().stream()
                    .sorted(Comparator.comparingInt(ItineraryItem::getPosition))
                    .map(ItineraryItemResponse::from).toList();
            return new TripResponse(trip.getId(), trip.getName(), trip.getDestination(), trip.getStartDate(), trip.getEndDate(), trip.getVersion(), trip.getCreatedAt(), items);
        }
    }
}
