CREATE TABLE trips (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    destination VARCHAR(160) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_trip_dates CHECK (end_date >= start_date)
);
CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    position INTEGER NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_itinerary_times CHECK (end_at > start_at),
    CONSTRAINT ck_itinerary_position CHECK (position >= 0)
);
CREATE INDEX idx_itinerary_trip_position ON itinerary_items(trip_id, position);
