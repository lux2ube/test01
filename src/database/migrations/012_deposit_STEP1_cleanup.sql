-- ============================================================
-- STEP 1: CLEANUP - Run this FIRST to remove all old functions
-- ============================================================
-- This finds and drops ALL versions of the conflicting functions
-- Run this in Supabase SQL Editor BEFORE running Step 2
-- ============================================================

-- Find all existing function signatures (for reference)
-- You can run this SELECT first to see what exists:
/*
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('ledger_create_withdrawal','ledger_create_order','ledger_add_deposit')
ORDER BY function_name;
*/

-- Drop ALL versions of ledger_create_withdrawal
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'ledger_create_withdrawal'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.ledger_create_withdrawal(%s)', func_record.args);
        RAISE NOTICE 'Dropped: ledger_create_withdrawal(%)', func_record.args;
    END LOOP;
END $$;

-- Drop ALL versions of ledger_create_order
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'ledger_create_order'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.ledger_create_order(%s)', func_record.args);
        RAISE NOTICE 'Dropped: ledger_create_order(%)', func_record.args;
    END LOOP;
END $$;

-- Drop ALL versions of ledger_add_deposit
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'ledger_add_deposit'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.ledger_add_deposit(%s)', func_record.args);
        RAISE NOTICE 'Dropped: ledger_add_deposit(%)', func_record.args;
    END LOOP;
END $$;

-- Verify cleanup - this should return 0 rows
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('ledger_create_withdrawal','ledger_create_order','ledger_add_deposit')
ORDER BY function_name;
