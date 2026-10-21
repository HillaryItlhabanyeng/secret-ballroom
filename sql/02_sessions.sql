CREATE TABLE sessions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	dancer_id  bigint  NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
	token_hash  text  NOT NULL UNIQUE,
	expires_at  timestamptz  NOT NULL,
	created_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_dancer ON sessions (dancer_id);