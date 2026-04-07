DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find a unique constraint on cart_items that only covers user_id and product_id
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'cart_items'
      AND con.contype = 'u'; -- 'u' for unique constraints

    IF constraint_name IS NOT NULL THEN
        -- Drop the old constraint
        EXECUTE 'ALTER TABLE public.cart_items DROP CONSTRAINT ' || constraint_name;
    END IF;
    
    -- Drop any unique indexes that might be acting as constraints
    FOR constraint_name IN 
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'cart_items' AND indexdef LIKE '%UNIQUE%' AND indexdef NOT LIKE '%pkey%'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS public.' || constraint_name;
    END LOOP;
END $$;
