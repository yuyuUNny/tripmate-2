package dev.unyli.tripmate.trip;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import com.fasterxml.jackson.databind.*;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TripApiIntegrationTest {
    private static final String OWNER = "auth0|owner";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Test
    void createsTripAndAddsAnItineraryItem() throws Exception {
        var start = LocalDate.now().plusDays(10);
        var body = """
                {"name":"Toronto weekend","startDate":"%s","endDate":"%s"}
                """.formatted(start, start.plusDays(2));
        var created = mvc.perform(post("/api/trips").with(scopes(OWNER, "write:trips")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().string("Location", matchesPattern("/api/trips/.+")))
                .andExpect(jsonPath("$.name", is("Toronto weekend")))
                .andExpect(jsonPath("$.currentUserRole", is("OWNER"))).andReturn();
        JsonNode trip = json.readTree(created.getResponse().getContentAsString());
        var item = """
                {"title":"Waterfront walk","startAt":"2030-06-01T14:00:00Z","endAt":"2030-06-01T16:00:00Z","position":0}
                """;
        mvc.perform(post("/api/trips/{id}/itinerary-items", trip.get("id").asText()).with(scopes(OWNER, "write:trips")).contentType(MediaType.APPLICATION_JSON).content(item))
                .andExpect(status().isOk()).andExpect(jsonPath("$.itineraryItems", hasSize(1)))
                .andExpect(jsonPath("$.itineraryItems[0].title", is("Waterfront walk")));
        mvc.perform(get("/api/trips/{id}", trip.get("id").asText()).with(scopes(OWNER, "read:trips"))).andExpect(status().isOk()).andExpect(jsonPath("$.itineraryItems", hasSize(1)));
    }
    @Test
    void rejectsAnInvalidTripDateRange() throws Exception {
        var start = LocalDate.now().plusDays(10);
        var body = """
                {"name":"Invalid trip","startDate":"%s","endDate":"%s"}
                """.formatted(start, start.minusDays(1));
        mvc.perform(post("/api/trips").with(scopes(OWNER, "write:trips")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code", is("invalid_trip")));
    }
    @Test
    void updatesTripDatesShownByTheTripList() throws Exception {
        var tripId = createTrip(OWNER, "Rescheduled trip");

        mvc.perform(patch("/api/trips/{id}/dates", tripId).with(scopes(OWNER, "write:trips"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"startDate\":\"2030-02-10\",\"endDate\":\"2030-02-18\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startDate", is("2030-02-10")))
                .andExpect(jsonPath("$.endDate", is("2030-02-18")));

        mvc.perform(get("/api/trips").with(scopes(OWNER, "read:trips")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].startDate".formatted(tripId), contains("2030-02-10")))
                .andExpect(jsonPath("$[?(@.id == '%s')].endDate".formatted(tripId), contains("2030-02-18")));
    }
    @Test
    void createsPastSingleDayTripWithoutAnInitialDestination() throws Exception {
        var start = LocalDate.now().minusDays(10);
        var body = """
                {"name":"Previous adventure","startDate":"%s","endDate":"%s"}
                """.formatted(start, start);
        mvc.perform(post("/api/trips").with(scopes(OWNER, "write:trips")).contentType(MediaType.APPLICATION_JSON).content(body))
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
        var created = mvc.perform(post("/api/trips").with(scopes(OWNER, "write:trips")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn();
        var tripId = json.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/trips").with(scopes(OWNER, "read:trips")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(tripId)));
        mvc.perform(delete("/api/trips/{id}", tripId).with(scopes(OWNER, "write:trips"))).andExpect(status().isNoContent());
        mvc.perform(get("/api/trips/{id}", tripId).with(scopes(OWNER, "read:trips")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/trips/{id}", tripId).with(scopes(OWNER, "write:trips")))
                .andExpect(status().isForbidden());
    }

    @Test
    void requiresAuthenticationForTripEndpoints() throws Exception {
        mvc.perform(get("/api/trips")).andExpect(status().isUnauthorized());
    }

    @Test
    void requiresTheOperationScope() throws Exception {
        mvc.perform(get("/api/trips").with(scopes(OWNER, "write:trips")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/trips").with(scopes(OWNER, "read:trips"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"No write scope\",\"startDate\":\"2030-01-01\",\"endDate\":\"2030-01-02\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void enforcesOwnerEditorAndViewerRolesPerTrip() throws Exception {
        var tripId = createTrip(OWNER, "Shared trip");
        var editor = "auth0|editor";
        var viewer = "auth0|viewer";

        saveMember(tripId, editor, "EDITOR");
        saveMember(tripId, viewer, "VIEWER");

        mvc.perform(get("/api/trips/{id}", tripId).with(scopes(viewer, "read:trips")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentUserRole", is("VIEWER")));
        mvc.perform(post("/api/trips/{id}/itinerary-items", tripId).with(scopes(viewer, "write:trips"))
                        .contentType(MediaType.APPLICATION_JSON).content(itineraryItem()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/trips/{id}/itinerary-items", tripId).with(scopes(editor, "write:trips"))
                        .contentType(MediaType.APPLICATION_JSON).content(itineraryItem()))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/trips/{id}", tripId).with(scopes(editor, "write:trips")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/trips/{id}", tripId).with(scopes("auth0|outsider", "read:trips")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listsOnlyTripsForTheCurrentUser() throws Exception {
        var ownerTrip = createTrip(OWNER, "Owner trip");
        createTrip("auth0|someone-else", "Private trip");

        mvc.perform(get("/api/trips").with(scopes(OWNER, "read:trips")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(ownerTrip)));
    }

    @Test
    void onlyOwnersWithManageScopeCanManageMembers() throws Exception {
        var tripId = createTrip(OWNER, "Team trip");
        saveMember(tripId, "auth0|editor", "EDITOR");

        mvc.perform(put("/api/trips/{id}/members", tripId).with(scopes("auth0|editor", "manage:members"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userSubject\":\"auth0|viewer\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/trips/{id}/members", tripId).with(scopes("auth0|editor", "read:trips")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(put("/api/trips/{id}/members", tripId).with(scopes(OWNER, "read:trips"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userSubject\":\"auth0|viewer\",\"role\":\"VIEWER\"}"))
                .andExpect(status().isForbidden());
    }

    private String createTrip(String subject, String name) throws Exception {
        var response = mvc.perform(post("/api/trips").with(scopes(subject, "write:trips"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\",\"startDate\":\"2030-01-01\",\"endDate\":\"2030-01-02\"}".formatted(name)))
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(response.getResponse().getContentAsString()).get("id").asText();
    }

    private void saveMember(String tripId, String subject, String role) throws Exception {
        mvc.perform(put("/api/trips/{id}/members", tripId).with(scopes(OWNER, "manage:members"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userSubject\":\"%s\",\"role\":\"%s\"}".formatted(subject, role)))
                .andExpect(status().isOk());
    }

    private String itineraryItem() {
        return "{\"title\":\"Museum\",\"startAt\":\"2030-01-01T10:00:00Z\",\"endAt\":\"2030-01-01T12:00:00Z\",\"position\":0}";
    }

    private RequestPostProcessor scopes(String subject, String... scopes) {
        List<GrantedAuthority> authorities = java.util.Arrays.stream(scopes)
                .map(scope -> (GrantedAuthority) new SimpleGrantedAuthority("SCOPE_" + scope))
                .toList();
        return jwt().jwt(builder -> builder.subject(subject)).authorities(authorities);
    }
}
