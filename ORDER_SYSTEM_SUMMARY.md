# Order Ledger System - Complete Implementation

## 📊 System Flow

### 1. User Submits Order
**File:** `src/app/actions.ts` (line 407)
**Function:** `placeOrder()`
**Stored Procedure:** `ledger_place_order`

**What happens:**
- Checks product stock
- Verifies user has sufficient balance
- Decrements product inventory
- Creates order record (status: "Pending")
- Creates transaction (type: `order_created`, amount: -price)
- **Increases `total_orders` by order amount**
- Creates immutable event & audit log

### 2. Admin Changes Order Status
**File:** `src/app/admin/manage-orders/actions.ts` (line 44)
**Function:** `updateOrderStatus()`
**Stored Procedure:** `ledger_change_order_status`

**What happens:**
- Fetches current order
- **Calls ledger function** to track status change
- Updates order status in database
- Awards/clawbacks referral commission if needed
- Sends notification to user

## 💰 Account Balance Logic

### `total_orders` Tracking:
- ✅ **INCREASES** when order submitted (→ Pending/Processing)
- ✅ **DECREASES** when order cancelled (any status → Cancelled)
- ❌ **NO CHANGE** for other status changes (→ Delivered, → Rejected, etc.)

### Available Balance Formula:
```
available_balance = total_earned - total_withdrawn - total_pending_withdrawals - total_orders
```

## 🗄️ Database Schema

### Stored Procedure: `ledger_change_order_status`
**Location:** `FIX_ORDER_LEDGER.sql`

**Parameters:**
- `p_user_id`: User UUID
- `p_reference_id`: Order UUID
- `p_old_status`: Current order status
- `p_new_status`: New order status
- `p_amount`: Order amount
- `p_metadata`: Additional data (JSON)
- `p_actor_id`: Admin/User UUID
- `p_actor_action`: Action description

**Returns:**
- `success`: Boolean
- `transaction_id`: UUID
- `error_message`: Text (if failed)

**Logic:**
```sql
IF new_status = 'Cancelled' AND old_status != 'Cancelled' THEN
    -- Decrease total_orders (return funds)
    UPDATE accounts SET total_orders = total_orders - amount
ELSE
    -- Just track status change, no balance update
END IF
```

## 📝 Installation Steps

### Step 1: Run SQL in Supabase
```bash
# Open FIX_ORDER_LEDGER.sql
# Copy all content
# Paste in Supabase SQL Editor
# Click "RUN"
```

### Step 2: Code is Already Updated
✅ Admin action now calls `ledger_change_order_status`
✅ Maintains ACID guarantees
✅ Creates audit trail

## 🧪 Testing

### Test Scenario 1: Order Cancellation
1. User submits order → `total_orders` +$50
2. Admin cancels order → `total_orders` -$50
3. Available balance restored

### Test Scenario 2: Order Delivery
1. User submits order → `total_orders` +$50
2. Admin marks "Delivered" → `total_orders` stays +$50 (no change)
3. Funds stay locked until cancelled

### Test Scenario 3: Multiple Status Changes
1. User submits order → `total_orders` +$50 (Pending)
2. Admin → "Processing" → `total_orders` stays +$50
3. Admin → "Delivered" → `total_orders` stays +$50
4. Later admin → "Cancelled" → `total_orders` -$50

## ⚠️ Important Notes

1. **Cancellation is FINAL**: Once cancelled, order can't be un-cancelled
2. **Audit Trail**: All status changes are logged in `immutable_events`
3. **Transactions**: All changes create transaction records
4. **ACID Compliance**: Uses PostgreSQL row-level locking
5. **Referral Commission**: Handled separately (awarded on Delivery, clawed back on Cancellation)

## 🔐 Security

- Uses `SECURITY DEFINER` for stored procedures
- Row-level locking prevents race conditions
- Immutable events prevent data tampering
- Admin role required for status changes
