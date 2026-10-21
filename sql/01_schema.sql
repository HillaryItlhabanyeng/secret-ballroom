CREATE TABLE dancers (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	username  text NOT NULL,
	auth_hash text NOT NULL, 
	kdf_salt  text NOT NULL,
	rhythm_ms int[] NOT NULL,
	failed_attempts int NOT NULL,
	locked_until  timestamptz,
	created_at  timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$')
);
CREATE UNIQUE INDEX idx_dancers_username ON dancers (lower(username));

CREATE TABLE journal_entries (
    id  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	dancer_id  bigint NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
	iv  text NOT NULL,
	ciphertext  text NOT NULL,
	created_at  timestamptz  NOT NULL DEFAULT now(),
	updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_entries_dancer_created ON journal_entries (dancer_id, created_at DESC);

CREATE TABLE todos (
    id  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	dancer_id  bigint NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
	iv  text NOT NULL,
	ciphertext  text NOT NULL,
	done  boolean NOT NULL DEFAULT false,
	position int NOT NULL DEFAULT 0,
	created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_todos_dancer_position ON todos (dancer_id, position);

