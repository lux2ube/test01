# 🚀 Ledger System Installation Guide

## Files You Need to Run in Supabase SQL Editor

### 1️⃣ FINAL_PROPER_FIX.sql
**Purpose:** Fixes withdrawal approval/rejection system
**Run this first!**

**What it does:**
- Updates `ledger_change_withdrawal_status` function
- Uses correct enum values: `withdrawal_completed`, `withdrawal_cancelled`
- Uses NON-ZERO transaction amounts
- Maintains ACID guarantees

### 2️⃣ FIX_ORDER_LEDGER.sql
**Purpose:** Fixes order status change tracking
**Run this second!**

**What it does:**
- Updates `ledger_change_order_status` function
- Handles cancellation from ANY status
- Decreases `total_orders` only when cancelled
- Tracks all status changes in audit trail

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click "SQL Editor" in left sidebar

### Step 2: Run Withdrawal Fix
1. Open `FINAL_PROPER_FIX.sql` in your code editor
2. Copy ALL content (Ctrl+A → Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"RUN"** button
5. Wait for success message ✅

### Step 3: Run Order Fix
1. Open `FIX_ORDER_LEDGER.sql` in your code editor
2. Copy ALL content (Ctrl+A → Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"RUN"** button
5. Wait for success message ✅

### Step 4: Verify Installation
1. Go to `/admin/manage-withdrawals` in your app
2. Try approving/rejecting a withdrawal
3. Go to `/admin/manage-orders`
4. Try changing order status to "Cancelled"
5. Check that balances update correctly

---

## ✅ What's Already Fixed in Code

### Withdrawal System (`src/app/admin/manage-withdrawals/actions.ts`)
- ✅ `approveWithdrawal()` calls ledger function
- ✅ `rejectWithdrawal()` calls ledger function
- ✅ Maintains ACID guarantees

### Order System (`src/app/admin/manage-orders/actions.ts`)
- ✅ `updateOrderStatus()` calls ledger function
- ✅ Tracks all status changes
- ✅ Decreases `total_orders` on cancellation
- ✅ Maintains ACID guarantees

---

## 🧪 Testing Scenarios

### Test Withdrawal Approval
```
1. User requests withdrawal ($50)
   → total_pending_withdrawals: +$50
2. Admin approves with TXID
   → total_pending_withdrawals: -$50
   → total_withdrawn: +$50
   → Available balance: -$50 (final)
```

### Test Withdrawal Rejection
```
1. User requests withdrawal ($50)
   → total_pending_withdrawals: +$50
2. Admin rejects
   → total_pending_withdrawals: -$50
   → Available balance: restored
```

### Test Order Cancellation
```
1. User submits order ($30)
   → total_orders: +$30
   → Available balance: -$30
2. Admin cancels order
   → total_orders: -$30
   → Available balance: restored
```

### Test Order Delivery (NO BALANCE CHANGE)
```
1. User submits order ($30)
   → total_orders: +$30
2. Admin → "Delivered"
   → total_orders: still +$30 (no change)
   → Balance stays locked
```

---

## 📊 Balance Formula

```
available_balance = 
    total_earned 
    - total_withdrawn 
    - total_pending_withdrawals 
    - total_orders
```

### What Affects Each Column:
- **total_earned**: Cashback + Referral commissions
- **total_withdrawn**: Completed withdrawals only
- **total_pending_withdrawals**: Processing withdrawals
- **total_orders**: Active orders (not cancelled or delivered)

---

## ⚠️ Troubleshooting

### Error: "violates check constraint valid_amount"
**Cause:** Old stored procedure trying to insert $0 transaction
**Fix:** Run `FINAL_PROPER_FIX.sql` again

### Error: "function does not exist"
**Cause:** Stored procedure not installed
**Fix:** Run both SQL files in Supabase

### Balance not updating
**Cause:** Code calling wrong function or SQL not installed
**Fix:** 
1. Check both SQL files are run in Supabase
2. Restart your app server
3. Try again

---

## 🎉 Success Indicators

When everything works correctly:

1. ✅ Withdrawals approve/reject without errors
2. ✅ Orders cancel and restore balance
3. ✅ All transactions logged in `transactions` table
4. ✅ All events logged in `immutable_events` table
5. ✅ Available balance formula always correct
