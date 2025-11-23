# Ledger System Migration Guide

## Overview
This guide will help you apply the financial-grade ledger system migrations to your Supabase database.

## Prerequisites
- Supabase project with PostgreSQL database
- Database access via Supabase SQL Editor (Dashboard → SQL Editor)

## Migration Steps

### Option 1: Via Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Apply each migration in order:

#### Migration 001: Create Accounts Table
```bash
Copy and paste the contents of: src/database/migrations/001_create_accounts_table.sql
```

#### Migration 002: Create Account Auto-Creation Trigger
```bash
Copy and paste the contents of: src/database/migrations/002_create_account_trigger.sql
```

#### Migration 003: Add RLS Policies for Accounts
```bash
Copy and paste the contents of: src/database/migrations/003_create_accounts_rls.sql
```

#### Migration 004: Create Transactions Table
```bash
Copy and paste the contents of: src/database/migrations/004_create_transactions_table.sql
```

#### Migration 005: Create Immutable Events Table
```bash
Copy and paste the contents of: src/database/migrations/005_create_immutable_events_table.sql
```

#### Migration 006: Create Audit Logs Table
```bash
Copy and paste the contents of: src/database/migrations/006_create_audit_logs_table.sql
```

#### Migration 007: Create Stored Procedures
```bash
Copy and paste the contents of: src/database/migrations/007_create_stored_procedures.sql
```

#### Migration 008: Additional Ledger Procedures
```bash
Copy and paste the contents of: src/database/migrations/008_additional_ledger_procedures.sql
```

### Option 2: Via Command Line (Alternative)

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SESSION_SECRET=your_32_character_secret
```

## Verification

After applying all migrations, verify they were successful:

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('accounts', 'transactions', 'immutable_events', 'audit_logs');
```

Expected result: 4 tables

### Check Stored Procedures Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'ledger_%';
```

Expected result: 8 procedures

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('accounts', 'transactions', 'immutable_events', 'audit_logs');
```

Expected result: All tables should have `rowsecurity = true`

## Database Schema

### Tables Created

1. **accounts** - User balance totals (running sums)
   - `user_id` (UUID, FK to auth.users)
   - `total_earned` (NUMERIC)
   - `total_withdrawn` (NUMERIC)
   - `total_pending_withdrawals` (NUMERIC)
   - `total_orders` (NUMERIC)

2. **transactions** - Unified ledger (single source of truth)
   - `id` (UUID)
   - `user_id` (UUID)
   - `type` (transaction_type ENUM)
   - `amount` (NUMERIC)
   - `reference_id` (UUID)
   - `metadata` (JSONB)

3. **immutable_events** - Permanent audit trail
   - `id` (UUID)
   - `transaction_id` (UUID, FK to transactions)
   - `event_type` (VARCHAR)
   - `event_data` (JSONB)
   - Cannot be updated or deleted

4. **audit_logs** - Admin action tracking
   - `id` (UUID)
   - `user_id` (UUID)
   - `action` (VARCHAR)
   - `resource_type` (VARCHAR)
   - `resource_id` (UUID)
   - `before` (JSONB)
   - `after` (JSONB)
   - `ip_address` (INET)
   - `user_agent` (TEXT)

### Stored Procedures

All procedures are `SECURITY DEFINER` and require service role authentication:

1. `ledger_add_cashback` - Add cashback to user account
2. `ledger_add_referral` - Add referral commission
3. `ledger_reverse_referral` - Reverse referral commission
4. `ledger_create_withdrawal` - Create withdrawal (with balance check)
5. `ledger_change_withdrawal_status` - Update withdrawal status
6. `ledger_create_order` - Create order (with balance check)
7. `ledger_change_order_status` - Update order status
8. `ledger_get_available_balance` - Get calculated available balance

## Available Balance Formula

```
available_balance = total_earned - total_withdrawn - total_pending_withdrawals - total_orders
```

## Security Features

- **Row Level Security (RLS)** on all tables
- **Immutable audit trail** (events and logs cannot be modified)
- **ACID compliance** via stored procedures
- **Balance validation** before withdrawals and orders
- **Automatic account creation** when user signs up

## Troubleshooting

### Migration fails with "permission denied"
- Ensure you're using the service role key, not anon key
- Check that RLS is properly configured in Supabase

### "Function does not exist" errors
- Verify migration 007 and 008 were applied successfully
- Check function grants in the migrations

### "Account not found" errors
- Ensure migration 002 (account trigger) was applied
- Manually create account: `INSERT INTO accounts (user_id) VALUES ('your-user-id')`

## Next Steps

After migrations are complete:

1. Test the ledger system with the included tests
2. Integrate ledger calls into your cashback/withdrawal workflows
3. Monitor audit logs for all financial operations
4. Set up alerts for suspicious activity

## Support

For issues or questions about the ledger system, refer to:
- TypeScript service layer: `src/lib/ledger/service.ts`
- Server actions: `src/app/actions/ledger.ts`
- Type definitions: `src/types/ledger.ts`
