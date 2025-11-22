# Financial Ledger System - Quick Start Guide

## 🚀 Quick Setup

### 1. Run Database Migrations

Execute migrations in order:

```sql
-- In your Supabase SQL editor or psql:
\i src/database/complete_schema.sql
```

Or run each migration file individually:
```bash
psql -U postgres -d your_database -f src/database/migrations/001_create_accounts_table.sql
psql -U postgres -d your_database -f src/database/migrations/002_create_auto_account_trigger.sql
psql -U postgres -d your_database -f src/database/migrations/003_create_rls_policies_accounts.sql
psql -U postgres -d your_database -f src/database/migrations/004_create_transactions_table.sql
psql -U postgres -d your_database -f src/database/migrations/005_create_immutable_events_table.sql
psql -U postgres -d your_database -f src/database/migrations/006_create_audit_logs_table.sql
```

### 2. Set Environment Variables

Make sure you have:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the System

```typescript
import { getAvailableBalance } from '@/lib/ledger';

// Get user balance
const balance = await getAvailableBalance(userId);
console.log(balance);
```

---

## 📖 Common Operations

### Check User Balance

```typescript
import { getAvailableBalance } from '@/lib/ledger';

const balance = await getAvailableBalance(userId);
// Returns: { available_balance: 550.00, total_earned: 1000, ... }
```

### Add Cashback

```typescript
import { addCashbackDirect } from '@/lib/ledger';

const result = await addCashbackDirect({
  userId: '123...',
  amount: 50.00,
  referenceId: 'cashback-tx-id',
  metadata: { order_id: '12345' }
});
```

### Create Withdrawal

```typescript
import { createWithdrawal } from '@/lib/ledger';

try {
  const withdrawal = await createWithdrawal({
    userId: '123...',
    amount: 200.00,
    referenceId: 'withdrawal-id'
  });
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    console.error('Not enough balance!');
  }
}
```

### Complete Withdrawal

```typescript
import { changeWithdrawalStatus } from '@/lib/ledger';

const result = await changeWithdrawalStatus({
  userId: '123...',
  referenceId: 'withdrawal-id',
  oldStatus: 'processing',
  newStatus: 'completed',
  amount: 200.00
});
```

### Create Order

```typescript
import { createOrder } from '@/lib/ledger';

const order = await createOrder({
  userId: '123...',
  amount: 300.00,
  referenceId: 'order-id',
  metadata: { product_id: 'ABC' }
});
```

### Cancel Order

```typescript
import { changeOrderStatus } from '@/lib/ledger';

const result = await changeOrderStatus({
  userId: '123...',
  referenceId: 'order-id',
  oldStatus: 'pending',
  newStatus: 'cancelled',
  amount: 300.00
});
// This releases the funds back to available balance
```

---

## 🔐 API Usage

### Get Balance (GET)

```bash
curl "http://localhost:5000/api/ledger/balance?userId=123..."
```

### Add Cashback (POST)

```bash
curl -X POST http://localhost:5000/api/ledger/cashback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123...",
    "amount": 50.00,
    "referenceId": "cashback-id"
  }'
```

### Create Withdrawal (POST)

```bash
curl -X POST http://localhost:5000/api/ledger/withdrawal \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "userId": "123...",
    "amount": 200.00,
    "referenceId": "withdrawal-id"
  }'
```

### Complete Withdrawal (POST)

```bash
curl -X POST http://localhost:5000/api/ledger/withdrawal \
  -H "Content-Type: application/json" \
  -d '{
    "action": "changeStatus",
    "userId": "123...",
    "referenceId": "withdrawal-id",
    "oldStatus": "processing",
    "newStatus": "completed",
    "amount": 200.00
  }'
```

---

## 🧪 Testing Balance Logic

### Scenario 1: Simple Cashback

```typescript
// User starts with 0 balance
// Add 100 cashback
await addCashbackDirect({ userId, amount: 100, referenceId: 'cb1' });

// Balance should be 100
const balance = await getAvailableBalance(userId);
// available_balance: 100
```

### Scenario 2: Withdrawal Flow

```typescript
// User has 500 earned
// Create withdrawal of 200
await createWithdrawal({ userId, amount: 200, referenceId: 'w1' });

// Balance = 500 - 0 - 200 - 0 = 300
const balance1 = await getAvailableBalance(userId);
// available_balance: 300

// Complete withdrawal
await changeWithdrawalStatus({
  userId, referenceId: 'w1',
  oldStatus: 'processing', newStatus: 'completed',
  amount: 200
});

// Balance = 500 - 200 - 0 - 0 = 300 (still 300, funds moved from pending to withdrawn)
const balance2 = await getAvailableBalance(userId);
// available_balance: 300
```

### Scenario 3: Order Flow

```typescript
// User has 1000 earned
// Create order for 300
await createOrder({ userId, amount: 300, referenceId: 'o1' });

// Balance = 1000 - 0 - 0 - 300 = 700
const balance1 = await getAvailableBalance(userId);
// available_balance: 700

// Cancel order
await changeOrderStatus({
  userId, referenceId: 'o1',
  oldStatus: 'pending', newStatus: 'cancelled',
  amount: 300
});

// Balance = 1000 - 0 - 0 - 0 = 1000 (funds released)
const balance2 = await getAvailableBalance(userId);
// available_balance: 1000
```

---

## ⚠️ Error Handling

```typescript
import { DatabaseError, InsufficientBalanceError } from '@/lib/ledger';

try {
  await createWithdrawal({ userId, amount: 1000, referenceId: 'w1' });
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    // User doesn't have enough balance
    console.error('Insufficient balance');
  } else if (error instanceof DatabaseError) {
    // Database operation failed
    console.error('Database error:', error.message);
  } else {
    // Unknown error
    console.error('Unknown error:', error);
  }
}
```

---

## 📊 Monitoring Queries

### Check Account Totals

```sql
SELECT 
  user_id,
  total_earned,
  total_withdrawn,
  total_pending_withdrawals,
  total_orders,
  (total_earned - total_withdrawn - total_pending_withdrawals - total_orders) as available_balance
FROM accounts
WHERE user_id = 'user-uuid';
```

### View Recent Transactions

```sql
SELECT 
  type,
  amount,
  reference_id,
  metadata,
  created_at
FROM transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### Audit Events

```sql
SELECT 
  event_type,
  event_data,
  created_at
FROM immutable_events
WHERE transaction_id IN (
  SELECT id FROM transactions WHERE user_id = 'user-uuid'
)
ORDER BY created_at DESC;
```

---

## 🔍 Debugging

### Verify Balance Calculation

```sql
-- Manual verification
SELECT 
  u.id as user_id,
  u.email,
  a.total_earned,
  a.total_withdrawn,
  a.total_pending_withdrawals,
  a.total_orders,
  (a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders) as calculated_balance
FROM users u
JOIN accounts a ON a.user_id = u.id
WHERE u.id = 'user-uuid';
```

### Check Transaction History

```sql
SELECT 
  type,
  amount,
  created_at,
  reference_id
FROM transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at;
```

---

## 📝 Notes

1. **Always use service functions** - Never manually update account totals
2. **Balance checks are automatic** - Withdrawals and orders check balance
3. **All operations are atomic** - Either complete or rollback entirely
4. **Events are immutable** - Cannot be modified after creation
5. **RLS is enabled** - Users can only see their own data

---

## 📚 Full Documentation

See `LEDGER_SYSTEM_README.md` for complete documentation.
