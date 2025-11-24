# ⚠️ CRITICAL: RUN THIS SQL IN SUPABASE NOW

## The Error
`column 'ip_address' is of type inet but expression is of type text`

## The Fix
Changed parameter type from `TEXT` to `INET` to match database schema.

```sql
-- BEFORE (WRONG):
p_ip_address TEXT DEFAULT NULL  ❌

-- AFTER (CORRECT):
p_ip_address INET DEFAULT NULL  ✅
```

## STEPS TO FIX:
1. **Open Supabase SQL Editor**
2. **Copy ENTIRE `SIMPLE_ORDER_SYSTEM.sql` file**
3. **Paste and click RUN**
4. **Go back to your app and try placing the order again**

This is the FINAL fix. All data types now match your database schema:
- ✅ reference_id: UUID
- ✅ resource_id: UUID  
- ✅ ip_address: INET
- ✅ quantity, total_price: included
- ✅ status: 'Processing'
