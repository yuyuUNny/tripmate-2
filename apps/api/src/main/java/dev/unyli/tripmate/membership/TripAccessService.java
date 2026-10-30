package dev.unyli.tripmate.membership;

import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class TripAccessService {
    private final TripMembershipRepository memberships;

    public TripAccessService(TripMembershipRepository memberships) {
        this.memberships = memberships;
    }

    public TripMembership requireMembership(UUID tripId, String subject, TripRole... allowedRoles) {
        var membership = memberships.findByTripIdAndUserSubject(tripId, subject)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this trip"));
        if (!Set.of(allowedRoles).contains(membership.getRole())) {
            throw new AccessDeniedException("Your trip role does not allow this operation");
        }
        return membership;
    }
}
