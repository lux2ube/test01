# رفيق الكاش باك - Complete System Architecture

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Ledger System (Financial Core)](#5-ledger-system-financial-core)
6. [User Flows](#6-user-flows)
7. [Admin Flows](#7-admin-flows)
8. [API Routes](#8-api-routes)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Security Model](#10-security-model)
11. [File Structure](#11-file-structure)

---

## 1. System Overview

**رفيق الكاش باك** (Cashback Companion) is a financial-grade cashback rewards platform for forex traders. The platform rewards users with cashback on every trade and includes:

- **Cashback System**: Users earn cashback from trading activities
- **Referral Program**: Users earn commissions when their referrals trade or purchase
- **Store/Marketplace**: Users can spend their cashback balance on products
- **Loyalty Tiers**: Users progress through levels for better commission rates
- **Withdrawal System**: Users can withdraw their earnings

### Business Model Flow
```
Trader Signs Up → Links Trading Account → Trades with Broker
                          ↓
              Admin Records Cashback → User Earns Balance
                          ↓
              User Spends in Store OR Withdraws Funds
                          ↓
              Referrer Earns Commission (if applicable)
```

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15.3.3 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth + iron-session |
| **Styling** | TailwindCSS + Radix UI |
| **State** | React Context (useAuthContext) |
| **AI** | Google Genkit |
| **Storage** | Supabase Storage |
| **Deployment** | Replit |

---

## 3. Database Schema

### 3.1 Core Tables

#### `users` - User Profiles
```sql
users (
    id UUID PRIMARY KEY,           -- Links to auth.users
    email TEXT,
    name TEXT,
    role TEXT ('user' | 'admin'),
    client_id SERIAL,              -- Human-readable sequential ID
    country TEXT,                  -- ISO 3166-1 alpha-2
    status TEXT ('NEW' | 'Active' | 'Trader'),
    
    -- Phone Verification
    phone_number TEXT,
    phone_number_verified BOOLEAN,
    
    -- KYC Data (embedded)
    kyc_status TEXT ('Pending' | 'Verified' | 'Rejected'),
    kyc_document_type TEXT,
    kyc_document_front_url TEXT,
    kyc_document_back_url TEXT,
    kyc_selfie_url TEXT,
    
    -- Address Data (embedded)
    address_status TEXT,
    address_country TEXT,
    address_city TEXT,
    address_street TEXT,
    address_document_url TEXT,
    
    -- Referral System
    referral_code TEXT UNIQUE,     -- User's referral code
    referred_by UUID,              -- FK to users.id (referrer)
    
    -- Loyalty System
    level INTEGER DEFAULT 1,       -- Level 1-6
    monthly_earnings NUMERIC,
    
    created_at TIMESTAMP
)
```

**Relationships:**
- `users.referred_by` → `users.id` (Self-referencing for referral tree)
- `users.id` → `auth.users.id` (Supabase Auth)

#### `accounts` - Ledger Balance Totals
```sql
accounts (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE,           -- FK to users.id (1:1)
    
    -- Running Balance Totals
    total_earned NUMERIC,          -- All cashback + referral commissions
    total_withdrawn NUMERIC,       -- Completed withdrawals
    total_pending_withdrawals NUMERIC, -- Processing withdrawals
    total_orders NUMERIC,          -- Store purchases (Processing status)
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

**Available Balance Formula:**
```
available_balance = total_earned 
                  - total_withdrawn 
                  - total_pending_withdrawals 
                  - total_orders
```

#### `transactions` - Unified Ledger (Single Source of Truth)
```sql
transactions (
    id UUID PRIMARY KEY,
    user_id UUID,                  -- FK to users.id
    account_id UUID,               -- FK to accounts.id
    
    transaction_type ENUM (
        'cashback',
        'referral_commission',
        'referral_reversal',
        'withdrawal_processing',
        'withdrawal_completed',
        'withdrawal_cancelled',
        'order_created',
        'order_cancelled'
    ),
    
    amount NUMERIC,
    reference_id UUID,             -- Links to orders/withdrawals/cashback_transactions
    metadata JSONB,                -- Additional context
    
    created_at TIMESTAMP
)
```

#### `immutable_events` - Permanent Audit Trail
```sql
immutable_events (
    id UUID PRIMARY KEY,
    transaction_id UUID,           -- FK to transactions.id
    event_type TEXT,
    event_data JSONB,
    created_at TIMESTAMP
    -- CANNOT be updated or deleted
)
```

#### `audit_logs` - Admin Action Tracking
```sql
audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,                  -- Who performed action
    action TEXT,
    resource_type TEXT,
    resource_id UUID,
    before JSONB,
    after JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP
)
```

### 3.2 Business Tables

#### `trading_accounts` - User's Broker Accounts
```sql
trading_accounts (
    id UUID PRIMARY KEY,
    user_id UUID,                  -- FK to users.id
    broker TEXT,
    account_number TEXT,
    status TEXT ('Pending' | 'Approved' | 'Rejected'),
    rejection_reason TEXT,
    created_at TIMESTAMP
)
```

#### `cashback_transactions` - Individual Cashback Records
```sql
cashback_transactions (
    id UUID PRIMARY KEY,
    user_id UUID,
    account_id UUID,               -- FK to trading_accounts.id
    account_number TEXT,
    broker TEXT,
    date TIMESTAMP,
    trade_details TEXT,            -- e.g., "Trade 1.5 lots EURUSD"
    cashback_amount NUMERIC,
    
    -- Legacy referral fields (now in ledger)
    referral_bonus_to UUID,
    referral_bonus_amount NUMERIC,
    source_user_id UUID,
    source_type TEXT ('cashback' | 'store_purchase'),
    
    transaction_id UUID,           -- FK to transactions.id
    note TEXT
)
```

#### `orders` - Store Orders
```sql
orders (
    id UUID PRIMARY KEY,
    user_id UUID,
    product_id UUID,
    product_name TEXT,
    product_image TEXT,
    product_price NUMERIC,
    delivery_phone_number TEXT,
    user_name TEXT,
    user_email TEXT,
    
    status TEXT ('Processing' | 'Confirmed' | 'Cancelled'),
    referral_commission_awarded BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP
)
```

**Order Status Transitions:**
```
Processing → Confirmed  ✅ (Awards referral commission)
Processing → Cancelled  ✅ (Returns funds to balance)
Confirmed → Cancelled   ❌ (Not allowed)
Cancelled → Confirmed   ❌ (Not allowed)
```

#### `withdrawals` - Withdrawal Requests
```sql
withdrawals (
    id UUID PRIMARY KEY,
    user_id UUID,
    amount NUMERIC,
    status TEXT ('Processing' | 'Completed' | 'Failed'),
    payment_method TEXT,
    withdrawal_details JSONB,
    requested_at TIMESTAMP,
    completed_at TIMESTAMP,
    tx_id TEXT,                    -- Transaction ID for crypto
    rejection_reason TEXT
)
```

#### `products` & `product_categories`
```sql
product_categories (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT
)

products (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    price NUMERIC,
    image_url TEXT,
    category_id UUID,              -- FK to product_categories.id
    category_name TEXT,
    stock INTEGER
)
```

#### `brokers` - Partner Broker Details
```sql
brokers (
    id UUID PRIMARY KEY,
    order INTEGER,
    logo_url TEXT,
    
    -- Nested JSONB objects for detailed info
    basic_info JSONB,              -- name, founded_year, headquarters
    regulation JSONB,              -- licenses, regulated_in
    trading_conditions JSONB,      -- leverage, spread, commission
    platforms JSONB,               -- MT4, MT5, custom
    instruments JSONB,             -- forex, crypto, stocks
    deposits_withdrawals JSONB,
    cashback JSONB,                -- cashback_per_lot, frequency
    global_reach JSONB,
    reputation JSONB,
    additional_features JSONB,
    instructions JSONB
)
```

#### `client_levels` - Loyalty Tier Configuration
```sql
client_levels (
    id INTEGER PRIMARY KEY,        -- Level 1-6
    name TEXT,                     -- e.g., "Bronze", "Silver"
    required_total NUMERIC,        -- Monthly earnings needed
    advantage_referral_cashback NUMERIC,  -- % commission on referral cashback
    advantage_referral_store NUMERIC,     -- % commission on referral purchases
    advantage_product_discount NUMERIC
)
```

#### `notifications` & `admin_notifications`
```sql
notifications (
    id UUID PRIMARY KEY,
    user_id UUID,
    message TEXT,
    type TEXT ('account' | 'cashback' | 'withdrawal' | 'store' | 'loyalty'),
    is_read BOOLEAN,
    link TEXT,
    created_at TIMESTAMP
)
```

#### `activity_logs` - Security Tracking
```sql
activity_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    event TEXT ('login' | 'logout' | 'signup' | 'withdrawal_request' | 'store_purchase'),
    timestamp TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    device JSONB,
    geo JSONB
)
```

### 3.3 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│   auth.users │◄──────│    users     │
│  (Supabase)  │   1:1 │              │
└──────────────┘       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              │               │               │               │
              ▼               ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
      │ accounts  │   │  orders   │   │withdrawals│   │ trading   │
      │  (1:1)    │   │  (1:N)    │   │   (1:N)   │   │ accounts  │
      └─────┬─────┘   └───────────┘   └───────────┘   └─────┬─────┘
            │                                               │
            ▼                                               ▼
      ┌─────────────┐                               ┌───────────────┐
      │transactions │                               │   cashback    │
      │    (1:N)    │◄──────────────────────────────│ transactions  │
      └─────┬───────┘                               └───────────────┘
            │
            ▼
      ┌─────────────┐
      │ immutable   │
      │   events    │
      └─────────────┘


users ←──── referred_by ────→ users (Self-referencing referral tree)
```

---

## 4. Authentication System

### 4.1 Why Custom Authentication?

**Problem:** Replit's iframe proxy strips third-party Secure/HttpOnly cookies, breaking standard Supabase SSR authentication.

**Solution:** Custom session management using `iron-session`:
- App-owned encrypted cookies (not Supabase's)
- Supabase tokens stored securely in our session
- Full control over cookie security settings

### 4.2 Session Data Structure

```typescript
// src/lib/auth/session.ts
interface SessionData {
    userId: string;
    access_token: string;
    refresh_token: string;
    expires_at: number;
}
```

### 4.3 Authentication Flow

#### Login Process
```
1. User submits credentials → /api/login
2. Supabase admin client authenticates user
3. Create iron-session cookie with tokens
4. Fetch user role to determine redirect
5. Return redirect URL (dashboard or admin)
6. Client redirects with session cookie set
```

#### Token Refresh Flow
```
1. Server request → createClient()
2. Check token expiry (5-minute buffer)
3. If expiring:
   a. Call refreshSession() with refresh_token
   b. Supabase returns new tokens
   c. Update session cookie
   d. Call supabase.auth.setSession()
4. If refresh fails:
   a. Destroy session cookie
   b. Return unauthenticated client
   c. Middleware redirects to login
```

#### Session Validation (Middleware)
```
Middleware checks:
1. Session cookie exists
2. Cookie can be unsealed (valid encryption)
3. Required fields present (userId, access_token, refresh_token)
4. Not expired beyond 7-day window
```

### 4.4 Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/session.ts` | iron-session management |
| `src/lib/supabase/server.ts` | Server-side Supabase client with token refresh |
| `src/middleware.ts` | Route protection |
| `src/app/api/login/route.ts` | Login endpoint |
| `src/app/api/logout/route.ts` | Logout endpoint |
| `src/app/api/set-session/route.ts` | Session synchronization |

### 4.5 Protected Routes

```typescript
// src/middleware.ts
const protectedRoutes = ['/dashboard', '/admin', '/phone-verification'];
```

---

## 5. Ledger System (Financial Core)

### 5.1 Design Principles

1. **ACID Compliance**: All financial operations use PostgreSQL stored procedures
2. **Immutability**: Financial events cannot be modified or deleted
3. **Audit Trail**: Every operation is logged with actor information
4. **Balance Integrity**: Running totals prevent recalculation errors

### 5.2 Available Balance Formula

```sql
available_balance = total_earned 
                  - total_withdrawn 
                  - total_pending_withdrawals 
                  - total_orders
```

### 5.3 Stored Procedures

All procedures are `SECURITY DEFINER` and require service role:

| Procedure | Purpose | Balance Effect |
|-----------|---------|----------------|
| `ledger_add_cashback` | Add cashback earnings | +total_earned |
| `ledger_add_referral` | Add referral commission | +total_earned |
| `ledger_reverse_referral` | Reverse commission | -total_earned |
| `ledger_create_withdrawal` | Start withdrawal | +total_pending_withdrawals |
| `ledger_change_withdrawal_status` | Complete/reject withdrawal | (see below) |
| `ledger_create_order` | Create store order | +total_orders |
| `ledger_change_order_status` | Confirm/cancel order | (see below) |
| `ledger_place_order` | **ATOMIC** order placement | Stock + Order + Ledger |
| `ledger_get_available_balance` | Calculate available balance | (read-only) |

### 5.4 Withdrawal Status Effects

| Transition | total_pending_withdrawals | total_withdrawn |
|------------|---------------------------|-----------------|
| processing → completed | -amount | +amount |
| processing → cancelled | -amount | (no change) |

### 5.5 Order Status Effects

| Transition | total_orders |
|------------|--------------|
| Processing (created) | +amount |
| Processing → Cancelled | -amount |
| Processing → Confirmed | (no change) |

**Note:** Commission is awarded on Confirmed, but confirmed orders cannot be cancelled.

### 5.6 Referral Commission Logic

```typescript
// src/app/admin/actions.ts → awardReferralCommission

Flow:
1. Check if user has a referrer (referred_by)
2. Get referrer's loyalty level
3. Look up commission rate from client_levels table
   - advantage_referral_cashback (for cashback source)
   - advantage_referral_store (for store purchase source)
4. Calculate: commission = amount × (rate / 100)
5. Call ledger_add_referral to add to referrer's balance
6. Update referrer's monthly_earnings

When Triggered:
- Cashback added → Referrer gets commission immediately
- Order confirmed → Referrer gets commission on confirmation
```

### 5.7 Ledger Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions                            │
│  src/app/actions/ledger.ts (Admin-only security layer)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ledger Service                            │
│  src/lib/ledger/service.ts (RPC wrapper)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Sub-Services (Specialized)                      │
│  balance-service.ts | cashback-service.ts | order-service.ts│
│  withdrawal-service.ts | referral-service.ts                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            PostgreSQL Stored Procedures                      │
│  SECURITY DEFINER | ACID | Row-level locking               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. User Flows

### 6.1 Registration Flow

```
1. User visits /register (optionally with ?ref=CODE)
2. Enter name, email, password
3. If referral code provided:
   a. Validate code exists in users.referral_code
   b. Store referrer's ID in referred_by
4. Supabase Auth creates auth.users record
5. Create users record with:
   - Generated referral_code (from name)
   - referred_by (if applicable)
   - status: 'NEW'
   - level: 1
6. Auto-create ledger account (trigger)
7. Log signup activity
8. Redirect to phone verification
```

### 6.2 Phone Verification Flow

```
1. User at /phone-verification
2. Enter phone number
3. Supabase sends OTP
4. User enters OTP
5. If valid:
   - Update phone_number_verified = true
   - Update status to 'Active'
   - Redirect to dashboard
```

### 6.3 Trading Account Linking

```
1. User browses brokers at /dashboard/brokers
2. Selects broker → /dashboard/brokers/[brokerId]/link
3. Enters account number
4. System creates trading_account with status: 'Pending'
5. Admin reviews and approves/rejects
6. If approved:
   - Status changes to 'Approved'
   - User status changes to 'Trader'
   - User can now receive cashback
```

### 6.4 Store Purchase Flow

```
1. User browses /dashboard/store
2. Selects product → /dashboard/store/[productId]
3. Clicks "Buy" → PurchaseForm dialog
4. Enters delivery details
5. Submits → placeOrder() server action
6. Server calls ledger_place_order (ATOMIC):
   a. Check available_balance >= price
   b. Decrease product stock
   c. Create order record (status: Processing)
   d. Create ledger transaction (order_created)
   e. Increase total_orders
7. Log activity
8. Redirect to /dashboard/store/orders
9. Admin later confirms → Referrer gets commission
```

### 6.5 Withdrawal Flow

```
1. User at /dashboard/withdraw
2. Select payment method
3. Enter amount and payment details
4. Submit → createWithdrawal()
5. Server:
   a. Check available_balance >= amount
   b. Create withdrawal record (status: Processing)
   c. Create ledger transaction (withdrawal_processing)
   d. Increase total_pending_withdrawals
6. Admin reviews:
   - Approve: Complete withdrawal, update ledger
   - Reject: Cancel withdrawal, return funds
7. User notified
```

### 6.6 Referral Dashboard

```
User at /dashboard/referrals sees:
1. Stats: Total earnings, referrals count, active referrals
2. Current loyalty level with benefits
3. Referral code and link to share
4. List of invited users
5. Commission history (from ledger transactions)
```

---

## 7. Admin Flows

### 7.1 Cashback Management

```
Admin at /admin/manage-cashback:
1. Select user's trading account
2. Enter cashback amount and trade details
3. Submit → addCashbackTransaction()
4. Server:
   a. Insert cashback_transactions record
   b. Call ledger_add_cashback
   c. Update user's monthly_earnings
   d. Create notification
   e. Award referral commission (if applicable)
```

### 7.2 Bulk Cashback Upload

```
Admin at /admin/bulk-cashback:
1. Upload Excel/CSV with columns:
   - Account Number
   - Cashback Amount
   - Note
2. System validates against approved trading_accounts
3. Process each row → addCashbackTransaction()
4. Show success/error counts
```

### 7.3 Order Management

```
Admin at /admin/manage-orders:
1. View all orders
2. For Processing orders:
   - Confirm: Call updateOrderStatus('Confirmed')
     → Award referral commission
     → Notify user
   - Cancel: Call updateOrderStatus('Cancelled')
     → Return funds to balance via ledger
     → Increase product stock
     → Notify user
```

### 7.4 Withdrawal Management

```
Admin at /admin/manage-withdrawals:
1. View all withdrawals
2. For Processing withdrawals:
   - Approve: Enter TX ID → approveWithdrawal()
     → Update ledger: -pending, +withdrawn
     → Update status to Completed
     → Notify user
   - Reject: Enter reason → rejectWithdrawal()
     → Update ledger: -pending (funds returned)
     → Update status to Failed
     → Notify user
```

### 7.5 User Verification

```
Admin at /admin/manage-verifications:
1. View pending KYC, Address, Phone verifications
2. Review uploaded documents
3. Approve or Reject with reason
4. Update user profile status
5. Create notification
```

### 7.6 Broker Management

```
Admin at /admin/manage-brokers:
1. Add/Edit broker with 11-step wizard:
   - Basic Info
   - Regulation
   - Trading Conditions
   - Platforms
   - Instruments
   - Deposits/Withdrawals
   - Cashback rates
   - Global Reach
   - Reputation
   - Additional Features
   - Instructions
2. Reorder brokers (drag & drop)
3. Delete broker
```

---

## 8. API Routes

### 8.1 Authentication Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/login` | POST | Login with email/password | Public |
| `/api/logout` | POST | Clear session cookies | Any |
| `/api/set-session` | POST | Sync Supabase session | Session |
| `/api/auth/callback` | GET | OAuth callback | Public |

### 8.2 Ledger Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/ledger/balance` | GET | Get user's available balance | User |
| `/api/ledger/cashback` | POST | Add cashback (direct) | Admin |
| `/api/ledger/order` | POST | Create/change order status | User/Admin |
| `/api/ledger/referral` | POST | Add/reverse referral | Admin |
| `/api/ledger/withdrawal` | POST | Create/change withdrawal | User/Admin |

### 8.3 Verification Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/upload` | POST | Upload verification documents | User |
| `/api/verification/kyc` | POST | Submit KYC data | User |
| `/api/verification/address` | POST | Submit address data | User |

### 8.4 Utility Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/geo` | GET | Get user's geolocation | Public |
| `/api/test-supabase` | GET | Test Supabase connection | Public |

---

## 9. Frontend Architecture

### 9.1 App Router Structure

```
src/app/
├── (static)/              # Public pages (about, contact, terms, etc.)
├── admin/                 # Admin dashboard
│   ├── layout.tsx         # Admin layout with sidebar
│   ├── dashboard/         # Admin home
│   ├── manage-*/          # Management pages
│   └── users/             # User management
├── dashboard/             # User dashboard
│   ├── layout.tsx         # User layout with sidebar
│   ├── page.tsx           # Dashboard home
│   ├── brokers/           # Broker browsing
│   ├── my-accounts/       # Trading accounts
│   ├── store/             # Store pages
│   ├── wallet/            # Balance info
│   ├── withdraw/          # Withdrawals
│   ├── referrals/         # Referral program
│   ├── transactions/      # Transaction history
│   └── settings/          # User settings
├── blog/                  # Blog pages
├── login/                 # Login page
├── register/              # Registration
└── api/                   # API routes
```

### 9.2 Component Hierarchy

```
src/components/
├── admin/                 # Admin-specific components
│   └── manage-verifications/
├── broker-form/           # Multi-step broker form
│   ├── BrokerFormWizard.tsx
│   └── steps/             # 11 step components
├── data-table/            # Reusable data table
├── shared/                # Shared components
│   ├── AdminGuard.tsx     # Admin route protection
│   ├── AuthGuard.tsx      # User route protection
│   └── PageHeader.tsx
├── ui/                    # Radix UI primitives (shadcn)
├── user/                  # User-specific components
│   ├── BrokerCard.tsx
│   ├── ProductCard.tsx
│   └── PurchaseForm.tsx
└── verification/          # Verification forms
```

### 9.3 State Management

**AuthContext** (`src/hooks/useAuthContext.tsx`):
```typescript
interface AuthContextType {
    user: {
        id: string;
        profile: UserProfile | null;
    } | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}
```

**Usage Pattern:**
```typescript
const { user, isLoading } = useAuthContext();

if (isLoading) return <Loader />;
if (!user) return <Redirect to="/login" />;
```

### 9.4 Guards

**AuthGuard** - Protects user routes:
```typescript
// Wraps dashboard layout
<AuthGuard>
    <DashboardContent />
</AuthGuard>
```

**AdminGuard** - Protects admin routes:
```typescript
// Wraps admin layout
<AdminGuard>
    <AdminDashboardContent />
</AdminGuard>
```

---

## 10. Security Model

### 10.1 Row Level Security (RLS)

| Table | Policy |
|-------|--------|
| `accounts` | Users can only read their own account |
| `transactions` | Users can only read their own transactions |
| `immutable_events` | Only service role can read/write |
| `audit_logs` | Only service role can read/write |

### 10.2 Server Actions Security

All financial server actions follow this pattern:

```typescript
export async function someLedgerAction(params) {
    // 1. Verify admin privileges
    const auth = await verifyAdminOrServiceRole();
    if (!auth.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }
    
    // 2. Include actor metadata
    const result = await ledgerService.operation({
        ...params,
        metadata: {
            _actor_id: auth.userId,
            _actor_action: 'action_name',
        }
    });
    
    return { success: true, result };
}
```

### 10.3 Stored Procedure Security

```sql
CREATE OR REPLACE FUNCTION ledger_add_cashback(...)
RETURNS TABLE(...) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's privileges
AS $$
BEGIN
    -- Row-level locking for concurrency
    SELECT * FROM accounts WHERE user_id = p_user_id FOR UPDATE;
    
    -- All operations in single transaction
    -- Automatic rollback on error
END;
$$;
```

### 10.4 Cookie Security

```typescript
const cookieOptions = {
    httpOnly: true,      // Prevents XSS
    secure: true,        // HTTPS only (production)
    sameSite: 'strict',  // CSRF protection
    maxAge: 60 * 60 * 24 * 7,  // 7 days
    path: '/'
};
```

### 10.5 Input Validation

- **File Uploads**: Type validation (images/PDF), size limit (10MB)
- **Phone Numbers**: libphonenumber-js validation
- **Forms**: Zod schema validation
- **UUIDs**: Type checking before database operations

---

## 11. File Structure

```
src/
├── ai/                    # AI/Genkit flows
│   └── flows/
├── app/                   # Next.js App Router
│   ├── (static)/          # Public pages
│   ├── actions/           # Shared server actions
│   │   ├── ledger.ts      # Ledger server actions
│   │   └── upload.ts      # Upload actions
│   ├── admin/             # Admin pages & actions
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── actions.ts         # Main server actions
│   └── middleware.ts      # Route protection
├── components/            # React components
│   ├── admin/
│   ├── broker-form/
│   ├── data-table/
│   ├── shared/
│   ├── ui/
│   ├── user/
│   └── verification/
├── database/              # Database migrations
│   ├── migrations/
│   └── scripts/
├── hooks/                 # React hooks
│   ├── useAuthContext.tsx
│   ├── useAdminData.ts
│   └── use-toast.ts
├── lib/                   # Utilities & services
│   ├── auth/              # Authentication
│   ├── ledger/            # Ledger services
│   ├── supabase/          # Supabase clients
│   └── utils.ts
├── scripts/               # Admin scripts
└── types/                 # TypeScript types
    ├── index.ts           # Main types
    └── ledger.ts          # Ledger types
```

---

## Summary

This system is a **financial-grade cashback platform** with:

1. **Secure Authentication**: Custom iron-session + Supabase Auth
2. **ACID-Compliant Ledger**: PostgreSQL stored procedures
3. **Referral System**: Automatic commission calculation based on loyalty levels
4. **Store System**: Atomic order placement with balance deduction
5. **Admin Dashboard**: Complete management of users, orders, withdrawals
6. **Arabic/RTL Support**: Full Arabic localization

**Key Technical Decisions:**
- All financial operations go through stored procedures
- Immutable audit trail for compliance
- Running balance totals prevent recalculation errors
- Session-based auth works within Replit's proxy environment
