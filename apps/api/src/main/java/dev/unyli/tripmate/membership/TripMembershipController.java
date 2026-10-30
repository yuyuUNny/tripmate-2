package dev.unyli.tripmate.membership;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips/{tripId}/members")
public class TripMembershipController {
    private final TripMembershipService memberships;

    public TripMembershipController(TripMembershipService memberships) {
        this.memberships = memberships;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_read:trips')")
    public List<MemberResponse> list(@PathVariable UUID tripId, @AuthenticationPrincipal Jwt jwt) {
        return memberships.list(tripId, jwt.getSubject()).stream().map(MemberResponse::from).toList();
    }

    @PutMapping
    @PreAuthorize("hasAuthority('SCOPE_manage:members')")
    public MemberResponse addOrUpdate(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SaveMemberRequest request) {
        return MemberResponse.from(memberships.addOrUpdate(tripId, jwt.getSubject(), request.userSubject(), request.role()));
    }

    @DeleteMapping("/{memberSubject}")
    @PreAuthorize("hasAuthority('SCOPE_manage:members')")
    public ResponseEntity<Void> remove(
            @PathVariable UUID tripId,
            @PathVariable String memberSubject,
            @AuthenticationPrincipal Jwt jwt) {
        memberships.remove(tripId, jwt.getSubject(), memberSubject);
        return ResponseEntity.noContent().build();
    }

    public record SaveMemberRequest(
            @NotBlank @Size(max = 200) String userSubject,
            @NotNull TripRole role) {}

    public record MemberResponse(UUID id, String userSubject, TripRole role, Instant createdAt) {
        static MemberResponse from(TripMembership membership) {
            return new MemberResponse(
                    membership.getId(), membership.getUserSubject(), membership.getRole(), membership.getCreatedAt());
        }
    }
}
