# Financial Ledger System Documentation

## Overview

This is a **financial-grade double-entry ledger system** designed to track user balances through running totals instead of recalculating from all transactions every time.

## Core Principle

**Available Balance Calculation:**
```
AVAILABLE_BALANCE = 
    total_earned 
  - total_withdrawn 
  - total_pending_withdrawals 
  - total_orders
```

The available balance is **ALWAYS CALCULATED** from these totals, never stored directly.

---

## Database Schema

### 1. **accounts** table

Stores running totals for each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table (unique) |
| `total_earned` | NUMERIC(12,2) | Sum of cashback + referral commissions |
| `total_withdrawn` | NUMERIC(12,2) | Sum of completed withdrawals |
| `total_pending_withdrawals` | NUMERIC(12,2) | Sum of processing withdrawals |
| `total_orders` | NUMERIC(12,2) | Sum of active orders |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Security:**
- Users can READ only their own account
- Only service role can UPDATE totals
- Automatically created when a user is created (via trigger)

---

### 2. **transactions** table

Unified ledger for all financial operations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `type` | ENUM | Transaction type (see below) |
| `amount` | NUMERIC(12,2) | Transaction amount |
| `reference_id` | UUID | Links to original record |
| `metadata` | JSONB | Additional context |
| `created_at` | TIMESTAMP | Transaction time |

**Transaction Types:**
- `cashback` - Cashback earned
- `referral` - Referral commission earned
- `referral_reversed` - Referral commission reversed
- `withdrawal_processing` - Withdrawal initiated
- `withdrawal_completed` - Withdrawal completed
- `withdrawal_cancelled` - Withdrawal cancelled
- `order_created` - Order created
- `order_cancelled` - Order cancelled

---

### 3. **immutable_events** table

Permanent audit history (cannot be modified or deleted).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | UUID | Links to transaction |
| `event_type` | VARCHAR | Event type |
| `event_data` | JSONB | Complete event snapshot |
| `created_at` | TIMESTAMP | Event time |

---

### 4. **audit_logs** table

Tracks admin and system actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who performed action |
| `action` | VARCHAR | Action name |
| `resource_type` | VARCHAR | Type of resource modified |
| `resource_id` | UUID | ID of modified resource |
| `before` | JSONB | State before change |
| `after` | JSONB | State after change |
| `ip_address` | INET | IP address |
| `user_agent` | TEXT | User agent |
| `created_at` | TIMESTAMP | Action time |

---

## Business Logic

### 1. **Earned Balance** (`total_earned`)

**Increases when:**
- Cashback transaction added
- Referral commission added

**Decreases when:**
- Referral commission reversed

### 2. **Withdrawn** (`total_withdrawn`)

**Increases when:**
- Withdrawal status becomes `completed`

### 3. **Pending Withdrawals** (`total_pending_withdrawals`)

**Increases when:**
- Withdrawal status is `processing`

**Decreases when:**
- Status changes from `processing` → `completed`
- Status changes from `processing` → `cancelled`

### 4. **Orders** (`total_orders`)

**Increases when:**
- Order created with non-cancelled status

**Decreases when:**
- Order changes to `cancelled`

---

## Backend Services

All services are located in `src/lib/ledger/`:

### **balance-service.ts**
- `getAvailableBalance(userId)` - Calculate and return available balance
- `getAccount(userId)` - Get account with all totals

### **cashback-service.ts**
- `addCashbackDirect(params)` - Add cashback transaction

### **referral-service.ts**
- `addReferralCommission(params)` - Add referral commission
- `reverseReferralCommission(params)` - Reverse referral commission

### **withdrawal-service.ts**
- `createWithdrawal(params)` - Create withdrawal (checks balance)
- `changeWithdrawalStatus(params)` - Change withdrawal status

### **order-service.ts**
- `createOrder(params)` - Create order (checks balance)
- `changeOrderStatus(params)` - Change order status

---

## API Endpoints

All endpoints are in `src/app/api/ledger/`:

### GET `/api/ledger/balance?userId={uuid}`
Get available balance for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "...",
    "total_earned": 1000.00,
    "total_withdrawn": 200.00,
    "total_pending_withdrawals": 100.00,
    "total_orders": 150.00,
    "available_balance": 550.00
  }
}
```

### POST `/api/ledger/cashback`
Add cashback transaction.

**Request:**
```json
{
  "userId": "...",
  "amount": 50.00,
  "referenceId": "...",
  "metadata": { "order_id": "12345" }
}
```

### POST `/api/ledger/referral`
Add or reverse referral commission.

**Add Commission:**
```json
{
  "action": "add",
  "userId": "...",
  "amount": 25.00,
  "referenceId": "..."
}
```

**Reverse Commission:**
```json
{
  "action": "reverse",
  "userId": "...",
  "amount": 25.00,
  "referenceId": "...",
  "reason": "Fraud detected"
}
```

### POST `/api/ledger/withdrawal`
Create or change withdrawal status.

**Create Withdrawal:**
```json
{
  "action": "create",
  "userId": "...",
  "amount": 200.00,
  "referenceId": "..."
}
```

**Change Status:**
```json
{
  "action": "changeStatus",
  "userId": "...",
  "referenceId": "...",
  "oldStatus": "processing",
  "newStatus": "completed",
  "amount": 200.00
}
```

### POST `/api/ledger/order`
Create or change order status.

**Create Order:**
```json
{
  "action": "create",
  "userId": "...",
  "amount": 300.00,
  "referenceId": "..."
}
```

**Change Status:**
```json
{
  "action": "changeStatus",
  "userId": "...",
  "referenceId": "...",
  "oldStatus": "pending",
  "newStatus": "cancelled",
  "amount": 300.00
}
```

---

## ACID Guarantees

Each service function ensures:

1. ✅ **Atomicity** - All operations succeed or all fail
2. ✅ **Consistency** - Account totals always match transaction history
3. ✅ **Isolation** - Concurrent operations don't interfere
4. ✅ **Durability** - All changes are permanent

Every operation:
1. Creates a transaction record
2. Updates account totals
3. Logs an immutable event
4. Creates an audit log

If any step fails, the entire operation rolls back.

---

## Testing

Test files are located in `src/lib/ledger/__tests__/`:

- `balance-service.test.ts` - Balance calculation tests
- `cashback-service.test.ts` - Cashback operation tests
- `withdrawal-service.test.ts` - Withdrawal operation tests
- `order-service.test.ts` - Order operation tests

Run tests with:
```bash
npm test
```

---

## Migration Files

SQL migrations are in `src/database/migrations/`:

1. `001_create_accounts_table.sql` - Accounts table
2. `002_create_auto_account_trigger.sql` - Auto-create account trigger
3. `003_create_rls_policies_accounts.sql` - RLS policies
4. `004_create_transactions_table.sql` - Transactions ledger
5. `005_create_immutable_events_table.sql` - Immutable events
6. `006_create_audit_logs_table.sql` - Audit logs

**Complete schema:** `src/database/complete_schema.sql`

---

## Security Features

1. **Row Level Security (RLS)**
   - Users can only read their own accounts
   - Only service role can modify totals

2. **Immutable Events**
   - Cannot be updated or deleted
   - Permanent audit trail

3. **Audit Logs**
   - Track all admin actions
   - Include before/after snapshots

4. **Balance Checks**
   - Withdrawals and orders check available balance
   - Prevent overspending

5. **Constraints**
   - All totals must be non-negative
   - Transactions must have non-zero amounts

---

## Error Handling

### **DatabaseError**
General database operation errors.

### **InsufficientBalanceError**
Thrown when user tries to withdraw or create order without sufficient balance.

Example:
```typescript
try {
  await createWithdrawal({ userId, amount: 1000, referenceId });
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    // Handle insufficient balance
  } else if (error instanceof DatabaseError) {
    // Handle database error
  }
}
```

---

## Example Usage

```typescript
import { getAvailableBalance } from '@/lib/ledger/balance-service';
import { addCashbackDirect } from '@/lib/ledger/cashback-service';
import { createWithdrawal } from '@/lib/ledger/withdrawal-service';

// Check balance
const balance = await getAvailableBalance(userId);
console.log(`Available: ${balance.available_balance}`);

// Add cashback
const result = await addCashbackDirect({
  userId,
  amount: 50.00,
  referenceId: cashbackTransactionId,
  metadata: { order_id: '12345' }
});

// Create withdrawal
try {
  const withdrawal = await createWithdrawal({
    userId,
    amount: 200.00,
    referenceId: withdrawalId
  });
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    console.error('Not enough balance');
  }
}
```

---

## System Requirements

- PostgreSQL 12+
- Supabase (for RLS and auth)
- Node.js 18+
- TypeScript 5+

---

## Deployment Checklist

- [ ] Run all migration files in order
- [ ] Verify triggers are created
- [ ] Test RLS policies
- [ ] Set up service role credentials
- [ ] Run tests
- [ ] Monitor first transactions
- [ ] Set up error alerting

---

## Support

For issues or questions, refer to:
- Migration files in `src/database/migrations/`
- Service implementations in `src/lib/ledger/`
- Test files in `src/lib/ledger/__tests__/`
