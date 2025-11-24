# 🚨 URGENT: Apply Complete Ledger Migration

## The Problem

You applied **only the stored procedures**, but the **tables are missing**!

The procedures reference these tables:
- ❌ `accounts` (does not exist)
- ❌ `transactions` (does not exist) 
- ❌ `immutable_events` (does not exist)
- ❌ `audit_logs` (does not exist)

This is why totals don't update - the procedures work, but they try to update tables that don't exist.

---

## The Solution (5 Minutes)

### Step 1: Open the Complete Migration File

Open this file: `src/database/migrations/FULL_LEDGER_MIGRATION.sql`

This file has **779 lines** and includes:
- ✅ Table creation (accounts, transactions, immutable_events, audit_logs)
- ✅ Indexes for performance
- ✅ RLS security policies
- ✅ Auto-account creation trigger
- ✅ All 9 stored procedures

### Step 2: Apply to Supabase

1. **Copy the entire file contents** (all 779 lines)
2. **Open Supabase Dashboard** → **SQL Editor**
3. **Paste** the SQL
4. **Click RUN**

You should see:
```
Migration complete!
```

### Step 3: Verify It Worked

Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('accounts', 'transactions', 'immutable_events', 'audit_logs');
```

You should see all 4 tables listed.

---

## After Migration

Once the tables exist:
1. The code changes I made will work immediately
2. Adding cashback will update `total_earned` automatically
3. All financial operations will be ACID-safe

---

## If You Get an Error

**"Table already exists"**: This is SAFE. The SQL uses `CREATE TABLE IF NOT EXISTS`, so existing tables won't be affected.

**"Function already exists"**: This is SAFE. The SQL uses `CREATE OR REPLACE FUNCTION`.

**Other errors**: Tell me the exact error message and I'll help.

---

## Why This Happened

The file you applied earlier (`SIMPLE_LEDGER_FIX.sql`) only had the 9 stored procedures. It assumed the tables already existed. Now we're applying the complete migration that creates everything.
