-- ============================================================================
-- ONE-TIME SCRIPT: Initialize Accounts for Existing Users
-- ============================================================================
-- This creates account records for users that existed before the ledger migration.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- ============================================================================

INSERT INTO public.accounts (user_id, total_earned, total_withdrawn, total_pending_withdrawals, total_orders)
SELECT 
    id, 
    0.00, 
    0.00, 
    0.00, 
    0.00
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.accounts)
ON CONFLICT (user_id) DO NOTHING;

-- Show how many accounts were created
SELECT 
    (SELECT COUNT(*) FROM public.accounts) AS total_accounts,
    (SELECT COUNT(*) FROM public.users) AS total_users,
    (SELECT COUNT(*) FROM public.accounts) = (SELECT COUNT(*) FROM public.users) AS all_users_have_accounts;
