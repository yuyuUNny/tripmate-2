# ADR 0001: Begin with a modular monolith

- Status: accepted
- Date: 2026-10-01

## Context

TripMate needs clear boundaries for identity, trips, membership, itinerary, collaboration, and
recommendations. It does not yet have traffic, team size, or independent deployment requirements that
justify distributed services.

## Decision

Use one Spring Boot deployment organized by domain modules. PostgreSQL remains authoritative for
durable state. Redis will later own only ephemeral collaboration data and caches.

## Consequences

- Transactions and local development remain straightforward.
- Domain boundaries can be tested before they become network boundaries.
- The project avoids claiming microservice experience without operating a distributed system.
- A module can be extracted later only when measurements show an independent scaling or reliability
  requirement.
