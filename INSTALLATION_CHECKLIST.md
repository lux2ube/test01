# ✅ Installation Checklist - Referral Commission System

## 📋 What You Need to Do

### Step 1: Install the Referral Commission Function
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy entire `REFERRAL_COMMISSION_FUNCTION.sql`** (120 lines)
3. **Paste and click RUN**
4. **Wait for "Success" message**

✅ **Done!** The function is now available in your database.

---

### Step 2: Test the Function (Optional)

Run this in Supabase SQL Editor to test:

```sql
-- Test with a real user ID from your users table
SELECT * FROM award_referral_commission_if_applicable(
  'your-user-id-here'::UUID,
  'cashback',
  100.00,
  gen_random_uuid(),
  '192.168.1.1'::INET,
  'Test User Agent'
);
```

**Expected Results:**
- If user has no referrer: `commission_awarded = FALSE`, `error_message = 'No referrer found'`
- If user has referrer: `commission_awarded = TRUE`, `commission_amount = calculated value`

---

## 📖 How It Works

### When to Call This Function

#### 1. When Admin Awards Cashback (Future Integration)
```typescript
// After successfully creating cashback_transaction
const { data } = await supabase.rpc('award_referral_commission_if_applicable', {
  p_invitee_user_id: userId,
  p_action_type: 'cashback',
  p_base_amount: cashbackAmount,
  p_reference_id: cashbackTransactionId,
  p_ip_address: ipAddress,
  p_user_agent: userAgent
});
```

#### 2. When User Places Order (Future Integration)
```typescript
// After successfully placing order
const { data } = await supabase.rpc('award_referral_commission_if_applicable', {
  p_invitee_user_id: userId,
  p_action_type: 'order',
  p_base_amount: orderTotalPrice,
  p_reference_id: orderId,
  p_ip_address: ipAddress,
  p_user_agent: userAgent
});

// If commission was awarded, mark the order
if (data?.commission_awarded) {
  await supabase
    .from('orders')
    .update({ referral_commission_awarded: true })
    .eq('id', orderId);
}
```

---

## 🎯 How Commission is Calculated

1. **Find the referrer** - Check `users.referred_by` field
2. **Get referrer's level** - Check `users.level_id`
3. **Get commission rate** - From `client_levels` table:
   - `advantage_referral_cashback` (for cashback)
   - `advantage_referral_store` (for orders)
4. **Calculate** - `commission = base_amount × percentage / 100`
5. **Award** - Uses existing `ledger_add_referral` function (ACID-safe)

---

## ⚠️ Important Notes

### 1. No Duplicate Protection
This function does **NOT** check if commission was already awarded. You must:
- Only call it once per cashback transaction
- Only call it once per order
- Check `orders.referral_commission_awarded` before calling for orders

### 2. ACID Guarantees
- Uses existing `ledger_add_referral` stored procedure
- All financial operations are transaction-safe
- Maintains double-entry accounting
- Creates immutable audit trail

### 3. Safe Error Handling
- Returns `FALSE` with error message instead of throwing exceptions
- Safe to call even if user has no referrer
- Returns detailed information about success/failure

---

## 📊 Example Scenarios

### Scenario 1: Bronze User Referral (5% cashback commission)
- User A (Bronze) refers User B
- User B gets $100 cashback
- **Result**: User A receives $5 commission

### Scenario 2: Silver User Referral (3% store commission)
- User A (Silver) refers User B
- User B places $200 order
- **Result**: User A receives $6 commission

### Scenario 3: No Referrer
- User C has no referrer
- User C gets $100 cashback
- **Result**: No commission awarded (error: "No referrer found")

---

## 📁 Documentation Files

- **REFERRAL_COMMISSION_FUNCTION.sql** - The SQL function to install
- **REFERRAL_COMMISSION_GUIDE.md** - Detailed usage guide
- **REFERRAL_COMMISSION_SUMMARY.md** - Quick overview
- **INSTALLATION_CHECKLIST.md** - This file

---

## ✅ Ready to Integrate?

The function is ready to use! Would you like me to:
1. ✅ Integrate it into your cashback admin action?
2. ✅ Integrate it into your order placement flow?

Just let me know and I'll update the code automatically.
