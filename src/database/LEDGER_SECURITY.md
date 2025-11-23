# Ledger System Security Model

## Overview
The ledger system implements financial-grade security with multiple layers of protection to prevent unauthorized balance manipulation.

## Security Layers

### 1. Row Level Security (RLS)
All ledger tables have RLS enabled:
- `accounts` - Users can only read their own account
- `transactions` - Users can only read their own transactions
- `immutable_events` - Only service role can read/write (audit trail)
- `audit_logs` - Only service role can read/write (admin actions)

### 2. Stored Procedures (SECURITY DEFINER)
All financial operations are implemented as PostgreSQL stored procedures with:
- ACID compliance (atomic transactions with row-level locking)
- Balance validation before withdrawals/orders
- Automatic audit trail creation
- Service role execution context

### 3. Server Action Authorization
All mutating server actions require admin privileges:

#### Admin-Only Actions
These actions check if the authenticated user has `role = 'admin'` in the users table:
- `addCashbackToLedger` - Add cashback earnings
- `addReferralCommissionToLedger` - Add referral commissions
- `reverseReferralCommissionInLedger` - Reverse referral commissions
- `createWithdrawalInLedger` - Create withdrawal requests
- `changeWithdrawalStatusInLedger` - Approve/reject withdrawals
- `createOrderInLedger` - Create store orders
- `changeOrderStatusInLedger` - Cancel/complete orders

#### User-Accessible Actions
These actions only require authentication (any logged-in user):
- `getMyBalance` - View own balance
- `getMyTransactions` - View own transaction history
- `getMyAccount` - View own account details

## Admin Role Setup

### 1. Grant Admin Role to User
To allow a user to perform ledger operations, update their role in the users table:

```sql
UPDATE users 
SET role = 'admin' 
WHERE id = 'user-uuid-here';
```

### 2. Verify Admin Access
```sql
SELECT id, email, role 
FROM users 
WHERE role = 'admin';
```

## Usage Patterns

### For Regular Users (Frontend)
```typescript
import { getMyBalance, getMyTransactions } from '@/app/actions/ledger';

// Get balance - ✅ Allowed
const { balance } = await getMyBalance();

// Get transactions - ✅ Allowed
const { transactions } = await getMyTransactions({ limit: 10 });
```

### For Admin Users (Admin Dashboard)
```typescript
import { 
  addCashbackToLedger,
  changeWithdrawalStatusInLedger 
} from '@/app/actions/ledger';

// Add cashback - ✅ Only works if user has role='admin'
const result = await addCashbackToLedger(
  userId,
  100.50,
  cashbackTransactionId,
  { tradeId: 'xyz123' }
);

if (!result.success) {
  // Will show "Unauthorized" if not admin
  console.error(result.error);
}
```

### For Backend Services (Server-Side Only)
```typescript
import * as ledgerService from '@/lib/ledger/service';

// Direct service layer access (requires SUPABASE_SERVICE_ROLE_KEY)
// This bypasses server actions entirely - use ONLY in trusted backend code
const result = await ledgerService.addCashback({
  userId: 'user-id',
  amount: 100.50,
  referenceId: 'cashback-tx-id',
  metadata: { source: 'automated_calculation' }
});
```

## Security Best Practices

### ✅ DO
- Use server actions for admin operations in admin dashboard
- Use direct service layer calls only in trusted backend code (cron jobs, webhooks)
- Verify admin role before showing admin UI elements
- Log all ledger operations for audit trail
- Monitor audit_logs table for suspicious activity

### ❌ DON'T
- Call mutating server actions from regular user components
- Expose service layer functions directly to client code
- Hard-code admin user IDs (always check role from database)
- Skip balance validation (stored procedures handle this)
- Manually manipulate accounts table (always use stored procedures)

## Authorization Flow

```
User Request → Server Action → Admin Check → Stored Procedure → Database
     ↓              ↓              ↓              ↓              ↓
  Session      verifyAdmin    role='admin'?   SECURITY      RLS
   Valid?         Role           Yes/No       DEFINER     Policies
```

## Audit Trail

Every ledger operation creates:
1. **Transaction record** - The financial transaction itself with metadata including actor attribution
2. **Immutable event** - Permanent audit log (cannot be modified/deleted)
3. **Audit log** - Admin action with before/after state, IP, user agent

### Actor Attribution

All admin operations include the actor's ID in the metadata:
- `_actor_id`: UUID of the admin who performed the operation
- `_actor_action`: The specific action performed (e.g., 'admin_add_cashback')

This allows full forensic tracking of WHO performed WHAT operation on WHICH user account.

Query audit trail with actor attribution:
```sql
-- Recent ledger operations with actor information
SELECT 
  t.type,
  t.amount,
  t.user_id as affected_user,
  t.metadata->>'_actor_id' as admin_who_acted,
  t.metadata->>'_actor_action' as admin_action,
  t.metadata,
  t.created_at
FROM transactions t
WHERE t.user_id = 'user-id'
ORDER BY t.created_at DESC
LIMIT 50;

-- Find all operations performed by a specific admin
SELECT 
  t.user_id as affected_user,
  t.type,
  t.amount,
  t.metadata->>'_actor_action' as action,
  t.created_at
FROM transactions t
WHERE t.metadata->>'_actor_id' = 'admin-user-id'
ORDER BY t.created_at DESC;
```

## Testing Authorization

### Test 1: Regular user cannot add cashback
```typescript
// Login as regular user (role != 'admin')
const result = await addCashbackToLedger(userId, 100, refId);
// Expected: { success: false, error: "Unauthorized..." }
```

### Test 2: Admin user can add cashback
```typescript
// Login as admin user (role = 'admin')
const result = await addCashbackToLedger(userId, 100, refId);
// Expected: { success: true, result: { transaction, event, audit_log } }
```

### Test 3: Anyone can view their own balance
```typescript
// Any authenticated user
const result = await getMyBalance();
// Expected: { success: true, balance: { available_balance, ... } }
```

## Troubleshooting

### "Unauthorized: Admin privileges required"
- Verify user has `role = 'admin'` in users table
- Check SUPABASE_SERVICE_ROLE_KEY is set correctly
- Ensure user is authenticated (valid session)

### "Account not found"
- Ensure migration 002 (auto account trigger) was applied
- Manually create account if needed:
  ```sql
  INSERT INTO accounts (user_id) VALUES ('user-id');
  ```

### "Insufficient balance"
- Check available balance: `total_earned - total_withdrawn - total_pending_withdrawals - total_orders`
- Ensure all previous operations completed successfully
- Check transactions table for user's history

## Production Deployment Checklist

- [ ] All 8 migrations applied to database
- [ ] **REQUIRED:** SUPABASE_SERVICE_ROLE_KEY environment variable set (mandatory for admin authorization)
- [ ] At least one admin user created (`UPDATE users SET role='admin'`)
- [ ] RLS policies tested (users can only see their own data)
- [ ] Admin authorization tested (only admins can mutate ledger)
- [ ] Audit logs monitored (set up alerts for suspicious activity)
- [ ] Balance validation tested (withdrawals/orders check available balance)
- [ ] ACID compliance verified (concurrent operations don't cause race conditions)

### Required Environment Variables

```bash
# MANDATORY - Required for admin authorization in ledger mutations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Standard Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Session management
SESSION_SECRET=your-secret-32-chars-min
```

**Why SERVICE_ROLE_KEY is required:**
- Admin authorization checks query the users table to verify role='admin'
- RLS policies prevent regular clients from querying other users' roles
- Service role client bypasses RLS to perform the authorization check
- Without it, all ledger mutations will fail with "Unauthorized" errors

**Fallback behavior:**
- If SERVICE_ROLE_KEY is missing, system attempts to use user's access_token
- This fallback is less reliable (tokens can expire, refresh can fail)
- For production deployments, always set SERVICE_ROLE_KEY

## Support

For security questions or issues:
- Review stored procedures: `src/database/migrations/007_create_stored_procedures.sql`
- Check RLS policies: `src/database/migrations/003_create_accounts_rls.sql`
- Audit logs query: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`
