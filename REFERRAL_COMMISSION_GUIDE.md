# 📘 Referral Commission System Guide

## Overview
This system automatically **awards and reverses** commission to referrers when their invitees:
1. **Get cashback** from trading → Commission awarded
2. **Place orders** in the store → Commission awarded
3. **Order is cancelled** → Commission reversed automatically

Commission rates are based on the **referrer's loyalty level**, using:
- `advantage_referral_cashback` - % when invitee gets cashback
- `advantage_referral_store` - % when invitee places order

---

## ✅ Installation Steps

### 1. Run the SQL Function in Supabase
1. Open **Supabase SQL Editor**
2. Copy **entire** `REFERRAL_COMMISSION_FUNCTION.sql` file
3. Click **RUN**
4. Wait for success message

### What Gets Installed:
- ✅ New column: `orders.referral_commission_transaction_id` (UUID)
- ✅ Function: `award_referral_commission_if_applicable`
- ✅ Function: `reverse_referral_commission_for_order`

---

## 🔧 How It Works

### Award Function Signature:
```sql
award_referral_commission_if_applicable(
  p_invitee_user_id UUID,       -- User who got cashback/placed order
  p_action_type TEXT,            -- 'cashback' or 'order'
  p_base_amount NUMERIC(12, 2),  -- Cashback amount or order total
  p_reference_id UUID,           -- cashback_transaction.id or order.id
  p_ip_address INET,             -- Optional
  p_user_agent TEXT              -- Optional
)
```

### Logic Flow:
1. ✅ Find the referrer (users.referred_by)
2. ✅ Get referrer's loyalty level (users.level_id)
3. ✅ Get commission percentage from client_levels table
4. ✅ Calculate commission amount
5. ✅ Award commission using `ledger_add_referral` (ACID-safe)
6. ✅ Return commission details

---

## 📊 Example Usage

### Example 1: Award Commission When Invitee Gets Cashback

```sql
-- User123 got $100 cashback
-- His referrer (if any) should get commission

SELECT * FROM award_referral_commission_if_applicable(
  'user123-uuid',          -- invitee user ID
  'cashback',              -- action type
  100.00,                  -- cashback amount
  'cashback-txn-uuid',     -- cashback transaction ID
  '192.168.1.1'::INET,     -- IP address
  'Mozilla/5.0...'         -- User agent
);

-- Returns:
-- commission_awarded: TRUE
-- referrer_user_id: 'referrer-uuid'
-- commission_amount: 5.00  (if referrer has 5% cashback commission)
-- transaction_id: UUID
-- event_id: UUID
-- audit_id: UUID
-- error_message: NULL
```

### Example 2: Award Commission When Invitee Places Order

```sql
-- User456 placed a $50 order
-- His referrer (if any) should get commission

SELECT * FROM award_referral_commission_if_applicable(
  'user456-uuid',          -- invitee user ID
  'order',                 -- action type
  50.00,                   -- order total price
  'order-uuid',            -- order ID
  '192.168.1.2'::INET,     -- IP address
  'Chrome/120...'          -- User agent
);

-- Returns:
-- commission_awarded: TRUE
-- referrer_user_id: 'referrer-uuid'
-- commission_amount: 1.00  (if referrer has 2% store commission)
```

### Example 3: No Commission (User Has No Referrer)

```sql
SELECT * FROM award_referral_commission_if_applicable(
  'orphan-user-uuid',
  'cashback',
  100.00,
  'cashback-txn-uuid',
  NULL,
  NULL
);

-- Returns:
-- commission_awarded: FALSE
-- referrer_user_id: NULL
-- commission_amount: 0.00
-- error_message: 'No referrer found'
```

### Example 4: REVERSE Commission When Order is Cancelled

```sql
-- Order was cancelled, need to reverse the referral commission
SELECT * FROM reverse_referral_commission_for_order(
  'order-uuid',            -- order ID that was cancelled
  '192.168.1.1'::INET,     -- IP address
  'Mozilla/5.0...'         -- User agent
);

-- Returns:
-- commission_reversed: TRUE
-- referrer_user_id: 'referrer-uuid' (who lost the commission)
-- commission_amount: 1.00 (amount reversed)
-- reversal_transaction_id: UUID
-- event_id: UUID
-- audit_id: UUID
-- error_message: NULL
```

---

## 🔗 Integration Points

### 1. When Admin Awards Cashback
In your cashback admin server action:

```typescript
// After successfully adding cashback to invitee
const { data: commissionResult } = await supabase.rpc(
  'award_referral_commission_if_applicable',
  {
    p_invitee_user_id: userId,
    p_action_type: 'cashback',
    p_base_amount: cashbackAmount,
    p_reference_id: cashbackTransactionId,
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  }
);

if (commissionResult?.commission_awarded) {
  console.log(`Referral commission awarded: $${commissionResult.commission_amount}`);
}
```

### 2. When User Places Order
In your order placement function (already created):

```typescript
// After successfully placing order
const { data: commissionResult } = await supabase.rpc(
  'award_referral_commission_if_applicable',
  {
    p_invitee_user_id: userId,
    p_action_type: 'order',
    p_base_amount: orderTotalPrice,
    p_reference_id: orderId,
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  }
);

if (commissionResult?.commission_awarded) {
  // Update order with commission tracking info
  await supabase
    .from('orders')
    .update({ 
      referral_commission_awarded: true,
      referral_commission_transaction_id: commissionResult.transaction_id
    })
    .eq('id', orderId);
}
```

### 3. When Order is Cancelled (REVERSAL)
In your order cancellation function:

```typescript
// When cancelling an order, reverse the referral commission
const { data: reversalResult } = await supabase.rpc(
  'reverse_referral_commission_for_order',
  {
    p_order_id: orderId,
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  }
);

if (reversalResult?.commission_reversed) {
  console.log(`Referral commission reversed: $${reversalResult.commission_amount}`);
  // The function automatically clears referral_commission_awarded and transaction_id
}
```

---

## 📋 Return Values

### Award Function Returns:

| Field | Type | Description |
|-------|------|-------------|
| `commission_awarded` | BOOLEAN | TRUE if commission was awarded |
| `referrer_user_id` | UUID | ID of the referrer who got commission |
| `commission_amount` | NUMERIC | Amount of commission awarded |
| `transaction_id` | UUID | ID of the transaction record |
| `event_id` | UUID | ID of the immutable event |
| `audit_id` | UUID | ID of the audit log |
| `error_message` | TEXT | NULL if success, error description if failed |

### Reversal Function Returns:

| Field | Type | Description |
|-------|------|-------------|
| `commission_reversed` | BOOLEAN | TRUE if commission was reversed |
| `referrer_user_id` | UUID | ID of the referrer who lost commission |
| `commission_amount` | NUMERIC | Amount of commission reversed |
| `reversal_transaction_id` | UUID | ID of the reversal transaction |
| `event_id` | UUID | ID of the immutable event |
| `audit_id` | UUID | ID of the audit log |
| `error_message` | TEXT | NULL if success, error description if failed |

---

## ⚠️ Important Notes

1. **Uses Existing `ledger_add_referral` Function**
   - All commission awards go through the existing ACID-safe stored procedure
   - Maintains financial integrity with double-entry accounting

2. **Automatic Commission Calculation**
   - Commission percentage comes from `client_levels` table
   - Different rates for cashback vs orders
   - Rounds to 2 decimal places

3. **Idempotency Consideration**
   - This function does NOT check if commission was already awarded
   - **YOU** must ensure you only call it once per cashback/order
   - For orders: check `orders.referral_commission_awarded` before calling

4. **Error Handling**
   - Returns `commission_awarded: FALSE` with error message
   - Does NOT throw exceptions (safe to call)
   - Check `error_message` field for details

---

## 🧪 Testing

### Test Scenario 1: User with Referrer Gets Cashback
1. Create User A (referrer) with Bronze level (5% cashback commission)
2. Create User B referred by User A
3. Award User B $100 cashback
4. Call the function
5. **Expected**: Referrer gets $5 commission

### Test Scenario 2: User with Referrer Places Order
1. Create User A (referrer) with Silver level (3% store commission)
2. Create User B referred by User A
3. User B places $200 order
4. Call the function
5. **Expected**: Referrer gets $6 commission

### Test Scenario 3: User Without Referrer
1. Create User C (no referrer)
2. User C gets $100 cashback
3. Call the function
4. **Expected**: No commission awarded, error message "No referrer found"

---

## 🔒 Security

- Function uses `SECURITY DEFINER` (runs with creator privileges)
- Granted to `service_role` and `authenticated` roles
- Commission calculation based on database values (no user input)
- Uses existing ledger function (maintains ACID guarantees)

---

## 📊 Database Impact

### Tables Modified:
1. **accounts** - referrer's `total_earned` increases
2. **transactions** - new 'referral' transaction created
3. **immutable_events** - new event logged
4. **audit_logs** - new audit record created

### Tables Read:
1. **users** - to find referrer and level
2. **client_levels** - to get commission percentages

---

## ✅ Next Steps

After installing this function, you need to integrate it into:
1. ✅ Cashback admin action (when admin awards cashback)
2. ✅ Order placement flow (when user places order)
3. ✅ Order confirmation flow (optional: award on confirmation instead of placement)

Would you like me to update your existing code to call this function automatically?
