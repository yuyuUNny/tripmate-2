CREATE TABLE trip_memberships (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_subject VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_trip_membership UNIQUE (trip_id, user_subject),
    CONSTRAINT ck_trip_membership_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'))
);

CREATE INDEX idx_trip_membership_subject ON trip_memberships(user_subject, trip_id);
