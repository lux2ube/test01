# ⚠️ CRITICAL: Apply Stored Procedures

## Why This is Required

Your ledger system **CANNOT WORK** without stored procedures. Without them:
- ❌ Race conditions will corrupt user balances
- ❌ Failed operations leave incomplete data
- ❌ Multiple requests overwrite each other

**The totals will NOT update until you complete these steps.**

---

## 📝 Step-by-Step Instructions (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard**
2. Click your project
3. Click **"SQL Editor"** in the left sidebar (icon looks like `</>`)
4. Click **"+ New query"** button

### Step 2: Copy the SQL

1. In Replit, open the file: **`attached_assets/SIMPLE_LEDGER_FIX.sql`**
2. Press **Ctrl+A** (Windows/Linux) or **Cmd+A** (Mac) to select all
3. Press **Ctrl+C** (Windows/Linux) or **Cmd+C** (Mac) to copy

### Step 3: Paste and Run

1. Go back to Supabase SQL Editor tab
2. Click in the SQL editor text area
3. Press **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac) to paste
4. You should see a long SQL script appear
5. Click the green **"RUN"** button (bottom right)

### Step 4: Verify Success

If successful, you'll see:
```
All 9 procedures created successfully!
```

If you see an error message, **copy the exact error** and tell me what it says.

---

## ✅ What Happens After

Once the procedures are installed:
- ✅ Add cashback → User's `total_earned` updates automatically
- ✅ Create withdrawal → User's `total_pending_withdrawals` updates
- ✅ All financial operations are ACID-safe (no corruption)

---

## 🆘 If It Still Doesn't Work

Tell me:
1. **What error message do you see?** (copy the exact text)
2. **At which step did it fail?** (Step 1, 2, 3, or 4)
3. **Can you see the SQL Editor?** (yes/no)

I will help you debug immediately.
