DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'persons_spouse_not_self'
          AND conrelid = 'persons'::regclass
    ) THEN
        ALTER TABLE persons
            ADD CONSTRAINT persons_spouse_not_self
            CHECK (spouse_id IS NULL OR spouse_id <> id);
    END IF;
END;
$$;

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

DROP TRIGGER IF EXISTS persons_sync_spouse_after_insert ON persons;
CREATE CONSTRAINT TRIGGER persons_sync_spouse_after_insert
AFTER INSERT ON persons
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (NEW.spouse_id IS NOT NULL)
EXECUTE FUNCTION sync_person_spouse();

DROP TRIGGER IF EXISTS persons_sync_spouse_after_update ON persons;
CREATE CONSTRAINT TRIGGER persons_sync_spouse_after_update
AFTER UPDATE ON persons
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (OLD.spouse_id IS DISTINCT FROM NEW.spouse_id)
EXECUTE FUNCTION sync_person_spouse();
