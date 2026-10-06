ALTER TABLE persons
    ADD COLUMN IF NOT EXISTS sex VARCHAR(1);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'persons_sex_check'
          AND conrelid = 'persons'::regclass
    ) THEN
        ALTER TABLE persons
            ADD CONSTRAINT persons_sex_check CHECK (sex IN ('M', 'F'));
    END IF;
END;
$$;
