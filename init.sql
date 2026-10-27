CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    birth_date DATE,
    address TEXT,
    phone TEXT,
    email TEXT,
    spouse_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    sex VARCHAR(1) CHECK (sex IN ('M', 'F')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT persons_spouse_not_self CHECK (spouse_id IS NULL OR spouse_id <> id)
);

CREATE OR REPLACE FUNCTION sync_person_spouse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.spouse_id IS DISTINCT FROM NEW.spouse_id
       AND OLD.spouse_id IS NOT NULL THEN
        UPDATE persons
        SET spouse_id = NULL
        WHERE id = OLD.spouse_id AND spouse_id = NEW.id;
    END IF;

    IF NEW.spouse_id IS NOT NULL THEN
        UPDATE persons
        SET spouse_id = NEW.id
        WHERE id = NEW.spouse_id AND spouse_id IS DISTINCT FROM NEW.id;
    END IF;

    RETURN NEW;
END;
$$;
CREATE CONSTRAINT TRIGGER persons_sync_spouse_after_insert
AFTER INSERT ON persons
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (NEW.spouse_id IS NOT NULL)
EXECUTE FUNCTION sync_person_spouse();

CREATE CONSTRAINT TRIGGER persons_sync_spouse_after_update
AFTER UPDATE ON persons
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (OLD.spouse_id IS DISTINCT FROM NEW.spouse_id)
EXECUTE FUNCTION sync_person_spouse();

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

CREATE TABLE agapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agape_food_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agape_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agape_id UUID NOT NULL REFERENCES agapes(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    food_type_id UUID NOT NULL REFERENCES agape_food_types(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO agape_food_types (name) VALUES
    ('Aperitivos'),
    ('Entrantes'),
    ('Segundos'),
    ('Postres'),
    ('Bebidas'),
    ('Café'),
	('Menú Infantil'),
	('Menaje');

-- Access is mediated by the server routes, which use the Supabase service role
-- only after validating the site or admin session. The public anon key must not
-- expose these tables directly.
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE traditio ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_psalm ENABLE ROW LEVEL SECURITY;
ALTER TABLE agapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agape_food_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE agape_assignments ENABLE ROW LEVEL SECURITY;

-- Local PostgreSQL does not define Supabase roles, so revoke only the roles
-- that exist in the target database. The service_role keeps its normal access.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE persons, services, person_services, events, groups,
            group_members, traditio, words, current_psalm, agapes,
            agape_food_types, agape_assignments FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE persons, services, person_services, events, groups,
            group_members, traditio, words, current_psalm, agapes,
            agape_food_types, agape_assignments FROM authenticated;
    END IF;
END;
$$;
