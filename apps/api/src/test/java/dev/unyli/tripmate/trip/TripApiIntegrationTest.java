package dev.unyli.tripmate.trip;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.*;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TripApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Test
    void createsTripAndAddsAnItineraryItem() throws Exception {
        var start = LocalDate.now().plusDays(10);
        var body = """
                {"name":"Toronto weekend","startDate":"%s","endDate":"%s"}
                """.formatted(start, start.plusDays(2));
        var created = mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().string("Location", matchesPattern("/api/trips/.+")))
                .andExpect(jsonPath("$.name", is("Toronto weekend"))).andReturn();
        JsonNode trip = json.readTree(created.getResponse().getContentAsString());
        var item = """
                {"title":"Waterfront walk","startAt":"2030-06-01T14:00:00Z","endAt":"2030-06-01T16:00:00Z","position":0}
                """;
        mvc.perform(post("/api/trips/{id}/itinerary-items", trip.get("id").asText()).contentType(MediaType.APPLICATION_JSON).content(item))
                .andExpect(status().isOk()).andExpect(jsonPath("$.itineraryItems", hasSize(1)))
                .andExpect(jsonPath("$.itineraryItems[0].title", is("Waterfront walk")));
        mvc.perform(get("/api/trips/{id}", trip.get("id").asText())).andExpect(status().isOk()).andExpect(jsonPath("$.itineraryItems", hasSize(1)));
    }
    @Test
    void rejectsAnInvalidTripDateRange() throws Exception {
        var start = LocalDate.now().plusDays(10);
        var body = """
                {"name":"Invalid trip","startDate":"%s","endDate":"%s"}
                """.formatted(start, start.minusDays(1));
        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code", is("invalid_trip")));
    }
    @Test
    void createsPastSingleDayTripWithoutAnInitialDestination() throws Exception {
        var start = LocalDate.now().minusDays(10);
        var body = """
                {"name":"Previous adventure","startDate":"%s","endDate":"%s"}
                """.formatted(start, start);
        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Previous adventure")))
                .andExpect(jsonPath("$.destination", is("")))
                .andExpect(jsonPath("$.startDate", is(start.toString())))
                .andExpect(jsonPath("$.endDate", is(start.toString())));
    }
    @Test
    void listsAndDeletesTrips() throws Exception {
        var start = LocalDate.now().plusDays(20);
        var body = """
                {"name":"Trip to remove","startDate":"%s","endDate":"%s"}
                """.formatted(start, start.plusDays(3));
        var created = mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn();
        var tripId = json.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/trips"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(tripId)));
        mvc.perform(delete("/api/trips/{id}", tripId)).andExpect(status().isNoContent());
        mvc.perform(get("/api/trips/{id}", tripId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("trip_not_found")));
        mvc.perform(delete("/api/trips/{id}", tripId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("trip_not_found")));
    }
}
