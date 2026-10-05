CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    birth_date DATE,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT,
    spouse_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO services (name) VALUES
    ('Responsable'),
    ('Corresponsable'),
    ('Lector'),
    ('Cantor'),
    ('Ostiario'),
    ('Didáscalo'),
    ('Misión'),
    ('Catequista');

CREATE TABLE person_services (
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (person_id, service_id)
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    starts_at TIMESTAMPTZ,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, person_id)
);

CREATE TABLE traditio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_1_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_2_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_3_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT different_persons CHECK (
        person_1_id <> person_2_id
        AND (
            person_3_id IS NULL
            OR (
                person_3_id <> person_1_id
                AND person_3_id <> person_2_id
            )
        )
    )
);

CREATE TABLE words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE current_psalm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    psalm_number INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_psalm_number CHECK (psalm_number > 0)
);

INSERT INTO current_psalm (psalm_number)
VALUES (1);