# Broker Architecture Documentation

## Overview
This document maps the complete broker data structure from Supabase database through Admin form to User display pages.

---

## 📊 Supabase Database Schema

### Table: `brokers`

```sql
CREATE TABLE brokers (
  id UUID PRIMARY KEY,
  order INT,                          -- Display order
  
  -- Legacy Fields
  name VARCHAR,                       -- Broker name (legacy)
  description TEXT,                  -- Description (legacy)
  category VARCHAR,                  -- 'forex' | 'crypto' | 'other'
  rating INT,                         -- 1-5 rating
  logo_url VARCHAR,                   -- Broker logo URL
  
  -- Basic Info
  basic_info JSONB,
  {
    broker_name: string;
    group_entity: string;
    founded_year: number;
    headquarters: string;
    CEO: string;
    broker_type: string;
  }
  
  -- Regulation & Licensing
  regulation JSONB,
  {
    licenses: [{
      authority: string;              -- FCA, CySEC, ASIC
      licenseNumber?: string;
      status: string;
    }];
    regulated_in: string[];           -- Countries regulated
    regulator_name: string[];         -- Regulator names
    regulation_status: string;
    offshore_regulation: boolean;
    risk_level: string;               -- 'Low' | 'Medium' | 'High'
  }
  
  -- Trading Conditions
  trading_conditions JSONB,
  {
    account_types: string[];          -- ['Standard', 'VIP', 'Pro']
    max_leverage: string;             -- '1:500'
    min_deposit: number;              -- Min deposit in USD
    spread_type: string;              -- 'Fixed' | 'Variable'
    min_spread: number;               -- Minimum spread in pips
    commission_per_lot: number;
    execution_speed: string;          -- 'Fast' | 'Ultra-Fast'
    swap_free: boolean;               -- Has swap-free accounts
  }
  
  -- Trading Platforms
  platforms JSONB,
  {
    platforms_supported: string[];    -- ['MT4', 'MT5', 'cTrader']
    mt4_license_type: 'Full License' | 'White Label' | 'None';
    mt5_license_type: 'Full License' | 'White Label' | 'None';
    custom_platform: boolean;
  }
  
  -- Tradeable Instruments
  instruments JSONB,
  {
    forex_pairs: string;              -- '50+', '200+', etc
    crypto_trading: boolean;
    stocks: boolean;
    commodities: boolean;
    indices: boolean;
  }
  
  -- Deposits & Withdrawals
  deposits_withdrawals JSONB,
  {
    payment_methods: string[];        -- ['Credit Card', 'Wire', 'Crypto']
    min_withdrawal: number;
    withdrawal_speed: string;         -- 'Instant', '1-3 Days'
    deposit_fees: boolean;
    withdrawal_fees: boolean;
  }
  
  -- Cashback Program
  cashback JSONB,
  {
    cashback_per_lot: number;         -- E.g., 2.5 USD per lot
    cashback_account_type: string[];  -- Account types eligible
    cashback_frequency: 'Daily' | 'Weekly' | 'Monthly';
    rebate_method: string[];          -- ['Balance Transfer', 'Bank']
    affiliate_program_link: string;   -- Link to affiliate program
  }
  
  -- Global Reach
  global_reach JSONB,
  {
    business_region: string[];        -- ['Europe', 'Asia', 'Americas']
    global_presence: string;          -- '150+ countries' text
    languages_supported: string[];    -- ['English', 'Arabic', 'French']
    customer_support_channels: string[]; -- ['Phone', 'Email', 'Chat']
  }
  
  -- Reputation & Reviews
  reputation JSONB,
  {
    wikifx_score: number;             -- 0-10
    trustpilot_rating: number;        -- 0-5
    reviews_count: number;
    verified_users: number;
  }
  
  -- Additional Features
  additional_features JSONB,
  {
    education_center: boolean;
    copy_trading: boolean;
    demo_account: boolean;
    trading_contests: boolean;
    regulatory_alerts: string;
    welcome_bonus: boolean;
  }
  
  -- Account Setup Instructions
  instructions JSONB,
  {
    description: string;
    linkText: string;
    link: string;
    new_account_instructions?: string;
    new_account_link?: string;
    new_account_link_text?: string;
  }
  
  -- Existing Account Instructions
  existing_account_instructions TEXT;
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🏗️ TypeScript Type Definition

```typescript
// From: src/types/index.ts

export interface Broker {
  id: string;                    // UUID from Supabase
  order: number;                 // Display order
  logoUrl: string;               // Logo URL
  
  // Basic Information
  basicInfo: {
    broker_name: string;
    group_entity: string;
    founded_year: number;
    headquarters: string;
    CEO: string;
    broker_type: string;
  };
  
  // Regulation & Licensing
  regulation: {
    licenses: { 
      authority: string;
      licenseNumber?: string;
      status: string;
    }[];
    regulated_in: string[];
    regulator_name: string[];
    regulation_status: string;
    offshore_regulation: boolean;
    risk_level: string;
  };
  
  // Trading Conditions
  tradingConditions: {
    account_types: string[];
    max_leverage: string;
    min_deposit: number;
    spread_type: string;
    min_spread: number;
    commission_per_lot: number;
    execution_speed: string;
    swap_free: boolean;
  };
  
  // Platforms
  platforms: {
    platforms_supported: string[];
    mt4_license_type: 'Full License' | 'White Label' | 'None';
    mt5_license_type: 'Full License' | 'White Label' | 'None';
    custom_platform: boolean;
  };
  
  // Instruments
  instruments: {
    forex_pairs: string;
    crypto_trading: boolean;
    stocks: boolean;
    commodities: boolean;
    indices: boolean;
  };
  
  // Deposits & Withdrawals
  depositsWithdrawals: {
    payment_methods: string[];
    min_withdrawal: number;
    withdrawal_speed: string;
    deposit_fees: boolean;
    withdrawal_fees: boolean;
  };
  
  // Cashback
  cashback: {
    cashback_per_lot: number;
    cashback_account_type: string[];
    cashback_frequency: 'Daily' | 'Weekly' | 'Monthly';
    rebate_method: string[];
    affiliate_program_link: string;
  };
  
  // Global Reach
  globalReach: {
    business_region: string[];
    global_presence: string;
    languages_supported: string[];
    customer_support_channels: string[];
  };
  
  // Reputation
  reputation: {
    wikifx_score: number;
    trustpilot_rating: number;
    reviews_count: number;
    verified_users: number;
  };
  
  // Additional Features
  additionalFeatures: {
    education_center: boolean;
    copy_trading: boolean;
    demo_account: boolean;
    trading_contests: boolean;
    regulatory_alerts: string;
    welcome_bonus: boolean;
  };
  
  // Instructions
  instructions: {
    description: string;
    linkText: string;
    link: string;
    new_account_instructions?: string;
    new_account_link?: string;
    new_account_link_text?: string;
  };
  
  // Legacy fields
  name: string;
  description: string;
  category: 'forex' | 'crypto' | 'other';
  rating: number;
  existingAccountInstructions: string;
}
```

---

## 📝 Admin Broker Form Schema

### Location: `src/app/admin/brokers/[brokerId]/page.tsx`

```typescript
type BrokerFormValues = {
  // Primary Fields
  logoUrl: string;                    // URL or placeholder
  category: 'forex' | 'crypto' | 'other';
  description: string;
  
  // Basic Info Step
  basicInfo: {
    broker_name: string;              // Required
    year_founded?: number;
    headquarters?: string;
    website?: string;
    company_name?: string;
    group_entity?: string;
    founded_year?: number;
    CEO?: string;
    broker_type?: string;
  };
  
  // Regulation Step
  regulation: {
    is_regulated: boolean;            // Toggle
    licenses: { authority: string; licenseNumber?: string; status: string }[];
    regulatory_bodies?: string;
    investor_protection?: string;
    regulation_status?: string;
    offshore_regulation: boolean;
    risk_level?: string;
    regulated_in: string[];
    regulator_name: string[];
  };
  
  // Trading Conditions Step
  tradingConditions: {
    minimum_deposit?: number;
    maximum_leverage?: string;
    spreads_from?: number;
    commission?: string;
    account_types?: string;
    execution_type?: string;
    base_currency?: string;
    max_leverage: string;
    min_deposit: number;              // Default: 10
    spread_type?: string;
    min_spread: number;               // Default: 0
    commission_per_lot: number;       // Default: 0
    execution_speed?: string;
  };
  
  // Platforms Step
  platforms: {
    trading_platforms: string;
    mobile_trading: boolean;          // Default: false
    demo_account: boolean;            // Default: false
    copy_trading: boolean;            // Default: false
    platforms_supported: string[];
    mt4_license_type: 'Full License' | 'White Label' | 'None';
    mt5_license_type: 'Full License' | 'White Label' | 'None';
    custom_platform: boolean;
  };
  
  // Instruments Step
  instruments: {
    forex_pairs: string;
    crypto_trading: boolean;
    stocks: boolean;
    commodities: boolean;
    indices: boolean;
  };
  
  // Deposits & Withdrawals Step
  depositsWithdrawals: {
    payment_methods: string[];
    min_withdrawal: number;
    withdrawal_speed: string;
    deposit_fees: boolean;
    withdrawal_fees: boolean;
  };
  
  // Cashback Step
  cashback: {
    offers_cashback: boolean;         // Toggle
    cashback_amount?: number;
    cashback_currency: string;        // USD, EUR, etc
    cashback_frequency: 'Daily' | 'Weekly' | 'Monthly';
    minimum_withdrawal?: number;
    eligible_instruments?: string;
    terms_and_conditions?: string;
    affiliate_program_link?: string;
    cashback_account_type: string[];
    rebate_method: string[];
    cashback_per_lot: number;
  };
  
  // Global Reach Step
  globalReach: {
    business_region: string[];
    global_presence?: string;
    languages_supported: string[];
    customer_support_channels: string[];
  };
  
  // Reputation Step
  reputation: {
    wikifx_score: number;             // 0-10
    trustpilot_rating: number;        // 0-5
    reviews_count: number;
    verified_users: number;
  };
  
  // Additional Features Step
  additionalFeatures: {
    swap_free: boolean;
    education_center: boolean;
    copy_trading: boolean;
    demo_account: boolean;
    trading_contests: boolean;
    regulatory_alerts?: string;
    welcome_bonus: boolean;
  };
  
  // Instructions Step
  instructions: {
    description?: string;
    new_account_instructions?: string;
    new_account_link?: string;
    new_account_link_text?: string;
  };
  
  // Existing Account Instructions
  existingAccountInstructions: {
    description?: string;
    linkText?: string;
    link?: string;
  };
}
```

### Form Steps (10-step wizard):
1. **BasicInfoStep** - Broker name, founding, HQ, website, company info
2. **RegulationStep** - Licenses, regulatory bodies, protection, status
3. **TradingConditionsStep** - Deposits, leverage, spreads, commissions
4. **PlatformsStep** - Supported platforms, MT4/MT5 types
5. **InstrumentsStep** - Forex, crypto, stocks, commodities, indices
6. **DepositsWithdrawalsStep** - Payment methods, withdrawal speeds, fees
7. **CashbackStep** - Cashback amounts, frequency, terms
8. **GlobalReachStep** - Regions, languages, support channels
9. **ReputationStep** - WikiFx score, Trustpilot rating, reviews
10. **AdditionalFeaturesStep** - Bonus features and special offerings

---

## 👤 User Broker Page - Variables

### Location: `src/dashboard/brokers/page.tsx`

```typescript
// Component State
allBrokers: Broker[] = [];             // All brokers from DB
isLoading: boolean = true;
searchQuery: string = "";              // User search input
activeTab: string = 'forex';           // Selected category

// Computed Values
filteredBrokers: Broker[] = useMemo(() => {
  return allBrokers.filter(broker => 
    broker.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [allBrokers, searchQuery]);

// Tab-Specific Lists
getBrokersForTab(category) => Broker[]; // Returns filtered brokers by category
```

### Data Flow:
```
Supabase DB (brokers table)
    ↓ [getBrokers()]
Fetch ALL brokers
    ↓ [Sort by order]
Component State: allBrokers[]
    ↓ [useMemo + filter]
Component State: filteredBrokers[]
    ↓ [Split by category]
Three Tabs: Forex | Crypto | Other
    ↓ [Map each broker]
BrokerCard Component (display each broker)
```

### BrokerCard Component Variables

```typescript
interface BrokerCardProps {
  broker: Broker;  // Full broker object
}

// Display Fields Used:
- broker.logoUrl               // Broker logo image
- broker.name                  // Broker name
- broker.rating                // Star rating (1-5)
- broker.cashback.cashback_per_lot  // Cashback amount
- broker.tradingConditions.min_deposit
- broker.tradingConditions.max_leverage
- broker.reputation.trustpilot_rating
- broker.basicInfo.broker_type
```

---

## 🔄 Data Transformation Pipeline

### Database → Admin Form (Read/Edit)

```
Supabase brokers table
    ↓ [transformBrokerFromDB()]
Broker (TypeScript type)
    ↓ [getSafeDefaultValues()]
BrokerFormValues (Form schema)
    ↓ [React Hook Form]
BrokerFormWizard (10-step UI)
```

### Admin Form → Database (Save)

```
BrokerFormWizard (User fills form)
    ↓ [form.handleSubmit()]
BrokerFormValues (Form data)
    ↓ [transformFormToBroker()]
Broker (Database structure)
    ↓ [transformBrokerForDB()]
JSONB fields for each nested object
    ↓ [Supabase Update/Insert]
brokers table updated
```

### Functions:

```typescript
// Transform DB data to type
transformBrokerFromDB(dbBroker) => Broker

// Transform form values to broker
transformFormToBroker(formValues) => Broker

// Transform broker to DB format (snake_case)
transformBrokerForDB(broker) => {
  logo_url,
  basic_info,
  regulation,
  trading_conditions,
  platforms,
  instruments,
  deposits_withdrawals,
  cashback,
  global_reach,
  reputation,
  additional_features,
  name,
  description,
  category,
  rating,
  instructions,
  existing_account_instructions
}
```

---

## 📡 API Actions

### Location: `src/app/admin/manage-brokers/actions.ts`

```typescript
// Get all brokers (used in user page + admin)
getBrokers() => Promise<Broker[]>
  - Fetches all brokers ordered by 'order' field
  - Used in: User dashboard, Admin list

// Add new broker
addBroker(data: Omit<Broker, 'id' | 'order'>) => {
  success: boolean;
  error?: string;
  message: string;
}
  - Calculates next order number
  - Inserts new broker

// Update existing broker
updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) => {
  success: boolean;
  error?: string;
  message: string;
}

// Delete broker
deleteBroker(brokerId: string) => {
  success: boolean;
  error?: string;
  message: string;
}
```

---

## 🔍 Key Relationships

### One-to-Many: Broker → Cashback Offers
- Each broker can have multiple cashback programs
- Stored in `cashback` JSONB object with frequency options

### One-to-Many: Broker → Licenses
- Each broker can have multiple regulatory licenses
- Stored as array in `regulation.licenses`

### One-to-Many: Broker → Supported Platforms
- Each broker supports multiple platforms (MT4, MT5, cTrader)
- Stored in `platforms.platforms_supported[]`

### One-to-Many: Broker → Languages
- Each broker supports multiple languages
- Stored in `globalReach.languages_supported[]`

---

## 🎯 Field Defaults

When creating new brokers, these defaults are applied:

```typescript
{
  logoUrl: "https://placehold.co/100x100.png",
  category: 'forex',
  description: "",
  
  basicInfo: {
    broker_name: "",
    headquarters: "",
    website: "",
    company_name: "",
    group_entity: "",
    founded_year: new Date().getFullYear(),
    CEO: "",
    broker_type: ""
  },
  
  tradingConditions: {
    min_deposit: 10,
    min_spread: 0,
    commission_per_lot: 0,
    max_leverage: "1:500"
  },
  
  cashback: {
    offers_cashback: false,
    cashback_frequency: "Daily",
    cashback_per_lot: 0
  },
  
  reputation: {
    wikifx_score: 0,
    trustpilot_rating: 0,
    reviews_count: 0,
    verified_users: 0
  }
}
```

---

## 📊 Database Query Examples

### Fetch all brokers
```sql
SELECT * FROM brokers 
ORDER BY "order" ASC;
```

### Fetch by category
```sql
SELECT * FROM brokers 
WHERE category = 'forex'
ORDER BY "order" ASC;
```

### Search by name
```sql
SELECT * FROM brokers 
WHERE name ILIKE '%search%'
ORDER BY "order" ASC;
```

### Get highest order
```sql
SELECT MAX("order") as max_order FROM brokers;
```

---

## 👁️ Broker Preview Page (Single Broker Detail View)

### Location: `src/app/dashboard/brokers/[brokerId]/page.tsx`

### Page Variables & State:

```typescript
// Component State
broker: Broker | null = null;           // Fetched broker data
isLoading: boolean = true;              // Loading state
brokerId: string = params.brokerId;     // URL param
activeTab: string = "info";             // Active tab (info/trading/features/payment)

// Destructured Data (with safe defaults) - ALL VARIABLES PRESERVED
basicInfo = {} | BrokerBasicInfo;
regulation = {} | BrokerRegulation;
tradingConditions = {} | BrokerTradingConditions;
platforms = {} | BrokerPlatforms;
instruments = {} | BrokerInstruments;
depositsWithdrawals = {} | BrokerDepositsWithdrawals;
cashback = {} | BrokerCashback;
globalReach = {} | BrokerGlobalReach;
reputation = {} | BrokerReputation;
additionalFeatures = {} | BrokerAdditionalFeatures;
instructions = {} | BrokerInstructions;
logoUrl = "https://placehold.co/100x100.png";
```

### Page Layout Structure:

```
┌──────────────────────────────────────────────────┐
│ ← العودة إلى الوسطاء (Back Button)                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ [Logo] Broker Name              [Action Button]  │
│        Group Entity                              │
│                                                  │
│        📊 قسم الكاشباك (Cashback Section)        │
│        ├─ المكافأة: $[value]                      │
│        ├─ التكرار: [value]                       │
│        └─ نوع الحساب: [value]                    │
└──────────────────────────────────────────────────┘

┌─ WikiFX ─┬─ Verified ─┬─ Risk ─┬─ Founded ─┐
│  Score   │   Users    │ Level  │   Year    │
└─────────┴──────────┴────────┴─────────┘

┌────────────────────────────────────────┐
│ معلومات البروكر │ التداول │ مميزات │ الدفع │
└────────────────────────────────────────┘
```

### Hero Section (Top Card with Cashback)

**Layout:**
- Left: Logo (64x64px)
- Middle: Broker name (h1), Group entity (subtitle)
- Right: Action button "ابدأ في كسب الكاش باك"

**Cashback Section (within hero card):**
```
قسم الكاشباك
┌─────────────┬─────────────┬─────────────┐
│ المكافأة    │ التكرار     │ نوع الحساب  │
│ $[value]    │ [value]     │ [value]     │
└─────────────┴─────────────┴─────────────┘
```
- **Cashback per Lot:** `cashback.cashback_per_lot`
- **Frequency:** `cashback.cashback_frequency`
- **Account Type:** `cashback.cashback_account_type[0]`

### Metrics Row (4 Badges)
```
┌──────────┬──────────┬──────────┬──────────┐
│ WikiFX   │ Verified │  Risk    │ Founded  │
│ Score    │ Users    │  Level   │  Year    │
└──────────┴──────────┴──────────┴──────────┘
```
- **WikiFX Score:** `reputation.wikifx_score`
- **Verified Users:** `reputation.verified_users`
- **Risk Level:** `regulation.risk_level`
- **Founded Year:** `basicInfo.founded_year`

### Tabs Container (4 Tabs)

#### **Tab 1: معلومات البروكر (Broker Information)**

Contains 4 Detail Cards:

1. **المعلومات الأساسية**
   - CEO: `basicInfo.CEO`
   - Headquarters: `basicInfo.headquarters`
   - Type: `basicInfo.broker_type` (lookup)
   - Regulation Status: `regulation.regulation_status` (lookup)

2. **التراخيص**
   - Iterates: `regulation.licenses[]`
   - Per License: Authority, Number, Status
   - Uses: `ensureArray()` for safety

3. **تقييمات الوسيط**
   - Trustpilot Rating: `reputation.trustpilot_rating`
   - Reviews Count: `reputation.reviews_count`

4. **الدعم والخدمة**
   - Languages: `globalReach.languages_supported[]` (badges)
   - Support Channels: `globalReach.customer_support_channels[]` (badges)
   - Support Hours: `globalReach.global_presence` (lookup)

#### **Tab 2: التداول (Trading)**

Contains 3 Detail Cards:

1. **منصات التداول**
   - Platforms: `platforms.platforms_supported[]` (badges)
   - MT4 License: `platforms.mt4_license_type`
   - MT5 License: `platforms.mt5_license_type`

2. **الحسابات وأنواعها**
   - Types: `tradingConditions.account_types[]` (badges)
   - Min Deposit: `tradingConditions.min_deposit` (with $)
   - Max Leverage: `tradingConditions.max_leverage`
   - Spread Type: `tradingConditions.spread_type` (lookup)
   - Min Spread: `tradingConditions.min_spread`

3. **المنتجات المالية**
   - Forex: `instruments.forex_pairs` (boolean pill)
   - Stocks: `instruments.stocks` (boolean pill)
   - Commodities: `instruments.commodities` (boolean pill)
   - Indices: `instruments.indices` (boolean pill)

#### **Tab 3: مميزات حصرية (Exclusive Features)**

Contains 2 Detail Cards:

1. **مميزات التداول**
   - Min Spread: `tradingConditions.min_spread`
   - Max Leverage: `tradingConditions.max_leverage`

2. **ميزات الحساب**
   - Welcome Bonus: `additionalFeatures.welcome_bonus`
   - Copy Trading: `additionalFeatures.copy_trading`
   - Crypto Trading: `instruments.crypto_trading`
   - Islamic Accounts: `additionalFeatures.swap_free`
   - Demo Accounts: `additionalFeatures.demo_account`
   - Education Center: `additionalFeatures.education_center`
   - Trading Contests: `additionalFeatures.trading_contests`

#### **Tab 4: الدفع (Payment)**

Contains 1 Detail Card:

1. **طرق الدفع والسحب** (Complete)
   - Payment Methods: `depositsWithdrawals.payment_methods[]` (badges)
   - Min Deposit: `depositsWithdrawals.min_deposit || tradingConditions.min_deposit`
   - Min Withdrawal: `depositsWithdrawals.min_withdrawal`
   - Withdrawal Speed: `depositsWithdrawals.withdrawal_speed` (lookup)
   - Deposit Fees: `depositsWithdrawals.deposit_fees` (boolean pill)
   - Withdrawal Fees: `depositsWithdrawals.withdrawal_fees` (boolean pill)

### Helper Functions:

```typescript
// Transform database snake_case to camelCase
function transformBrokerFromDB(dbBroker: any): Broker

// Find label from TermsBank lookup tables
function findLabel(bank: {key: string, label: string}[], key: string | undefined): string

// Safely convert any value to array
function ensureArray<T>(value: any): T[]
```

### Data Flow:

```
Fetch broker by ID
    ↓
transformBrokerFromDB()
    ↓ [Convert snake_case to camelCase]
Broker type with all nested objects
    ↓ [Destructure with defaults]
Hero Card + Metrics + 4 Tabs with Detail Cards
    ↓ [Each card/tab maps data to display elements]
User sees complete broker profile with organized tabs
```

### Error Handling:

- **No data:** Shows `notFound()` page
- **Loading:** Shows skeleton loading state
- **Missing fields:** Safe defaults with optional chaining
- **Bad arrays:** `ensureArray()` converts strings/objects to arrays
- **Bad images:** Falls back to placeholder on error

### Styling:

- Max width: 2xl (42rem)
- Container: mx-auto with padding
- Hero Card: Flex layout with logo + info + action button
- Cashback Section: Grid 3-column within hero card
- Tabs: shadcn/ui Tabs component (4 tabs)
- Detail Cards: DetailCard component with icon + title
- Badges: Secondary variant for array items
- Boolean Pills: Green checkmark (✓) or red X
- RTL support: Arabic text direction throughout

---

## 📋 Summary

| Layer | Location | Variables | Type |
|-------|----------|-----------|------|
| **Database** | Supabase | brokers table | SQL |
| **TypeScript** | src/types/index.ts | Broker interface | Type |
| **Admin Form** | src/app/admin/brokers/[brokerId]/page.tsx | BrokerFormValues | Form Schema |
| **User List** | src/app/dashboard/brokers/page.tsx | Broker[] | Display |
| **User Detail** | src/app/dashboard/brokers/[brokerId]/page.tsx | Broker (single) | Display |
| **Components** | src/components/user/BrokerCard.tsx | broker prop | UI |
| **Actions** | src/app/admin/manage-brokers/actions.ts | CRUD functions | Server |

