# ✅ Referral Commission System - COMPLETED

## What Was Created

**File**: `REFERRAL_COMMISSION_FUNCTION.sql` (260 lines)

### 1. New Column: `orders.referral_commission_transaction_id`
Tracks the ledger transaction ID so we can reverse commission on cancellation.

### 2. Award Function: `award_referral_commission_if_applicable`
Awards commission to referrers when their invitees:
- ✅ Get cashback from trading
- ✅ Place orders in the store

### 3. Reversal Function: `reverse_referral_commission_for_order`
Reverses commission when orders are cancelled:
- ✅ Reads stored transaction ID from order
- ✅ Calls `ledger_reverse_referral` to reverse the commission
- ✅ Clears the order's commission flags

---

## 🎯 Key Features

### Automatic Commission Calculation
- Commission rate comes from referrer's loyalty level
- Different rates for cashback vs store orders
- Uses `client_levels.advantage_referral_cashback` for cashback
- Uses `client_levels.advantage_referral_store` for orders

### Financial Safety (ACID Guarantees)
- Uses existing `ledger_add_referral` stored procedure
- All financial operations are transaction-safe
- Maintains double-entry accounting
- Creates immutable audit trail

### Smart Logic
- Checks if user has a referrer
- Validates referrer has a loyalty level
- Calculates commission based on percentage
- Returns detailed results (success/failure with error message)

---

## 📋 Installation

1. Open **Supabase SQL Editor**
2. Copy entire `REFERRAL_COMMISSION_FUNCTION.sql`
3. Click **RUN**
4. Done!

---

## 🔌 How to Use

### Scenario 1: When Invitee Gets Cashback

```typescript
const { data } = await supabase.rpc('award_referral_commission_if_applicable', {
  p_invitee_user_id: userId,
  p_action_type: 'cashback',
  p_base_amount: 100.00,
  p_reference_id: cashbackTransactionId,
  p_ip_address: '192.168.1.1',
  p_user_agent: 'Mozilla/5.0...'
});

// data.commission_awarded = true/false
// data.commission_amount = 5.00 (example: 5% of $100)
```

### Scenario 2: When Invitee Places Order

```typescript
const { data } = await supabase.rpc('award_referral_commission_if_applicable', {
  p_invitee_user_id: userId,
  p_action_type: 'order',
  p_base_amount: orderTotalPrice,
  p_reference_id: orderId,
  p_ip_address: ipAddress,
  p_user_agent: userAgent
});

if (data?.commission_awarded) {
  // Update order with commission tracking info
  await supabase
    .from('orders')
    .update({ 
      referral_commission_awarded: true,
      referral_commission_transaction_id: data.transaction_id
    })
    .eq('id', orderId);
}
```

### Scenario 3: When Order is Cancelled (REVERSAL)

```typescript
const { data } = await supabase.rpc('reverse_referral_commission_for_order', {
  p_order_id: orderId,
  p_ip_address: ipAddress,
  p_user_agent: userAgent
});

// data.commission_reversed = true/false
// data.commission_amount = amount that was reversed
// The function automatically clears the order flags
```

---

## 📊 Return Values

| Field | Description |
|-------|-------------|
| `commission_awarded` | TRUE if commission was given |
| `referrer_user_id` | Who received the commission |
| `commission_amount` | Amount awarded |
| `transaction_id` | Ledger transaction ID |
| `event_id` | Immutable event ID |
| `audit_id` | Audit log ID |
| `error_message` | NULL on success, error text on failure |

---

## ⚠️ Important Notes

1. **No Duplicates**: This function does NOT check if commission was already awarded. You must ensure you only call it once per cashback/order.

2. **For Orders**: Check `orders.referral_commission_awarded` flag before calling.

3. **ACID Safe**: Uses existing `ledger_add_referral` function to maintain financial integrity.

4. **No Exceptions**: Returns error message instead of throwing, safe to call.

---

## 📖 Documentation

- **Installation & Usage**: See `REFERRAL_COMMISSION_GUIDE.md`
- **SQL Code**: See `REFERRAL_COMMISSION_FUNCTION.sql`

---

## ✅ What's Next?

You can now integrate this function into:
1. **Cashback admin action** - Award commission when admin gives cashback
2. **Order placement** - Award commission when user places order
3. **Order confirmation** (optional) - Award on confirmation instead of placement

Would you like me to integrate this into your existing cashback and order placement code automatically?
