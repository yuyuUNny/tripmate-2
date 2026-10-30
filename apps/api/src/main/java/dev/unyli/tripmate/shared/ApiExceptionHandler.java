package dev.unyli.tripmate.shared;

import dev.unyli.tripmate.trip.*;
import dev.unyli.tripmate.membership.InvalidMembershipException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    record ApiError(Instant timestamp, int status, String code, String message, List<String> details) {}
    @ExceptionHandler(TripNotFoundException.class)
    ResponseEntity<ApiError> notFound(TripNotFoundException e) { return error(HttpStatus.NOT_FOUND, "trip_not_found", e.getMessage(), List.of()); }
    @ExceptionHandler(InvalidTripException.class)
    ResponseEntity<ApiError> invalid(InvalidTripException e) { return error(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_trip", e.getMessage(), List.of()); }
    @ExceptionHandler(InvalidMembershipException.class)
    ResponseEntity<ApiError> invalidMembership(InvalidMembershipException e) { return error(HttpStatus.UNPROCESSABLE_ENTITY, "invalid_membership", e.getMessage(), List.of()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        var details = e.getBindingResult().getFieldErrors().stream().map(f -> f.getField() + ": " + f.getDefaultMessage()).toList();
        return error(HttpStatus.BAD_REQUEST, "validation_failed", "Request validation failed", details);
    }
    private ResponseEntity<ApiError> error(HttpStatus status, String code, String message, List<String> details) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), code, message, details));
    }
}
