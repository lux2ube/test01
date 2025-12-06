# Cashback Trading Platform (رفيق الكاش باك)

> **For complete technical documentation, see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)**

## Overview
A Next.js-based cashback platform for traders, designed to reward users with cashback on every trade. The platform includes a comprehensive loyalty and referral system, robust authentication, and trading account management. The business vision is to capture a significant market share in the trading cashback sector by offering a secure, feature-rich, and user-friendly experience.

## User Preferences
All server actions are secure with proper authentication. The system uses custom session-based authentication with iron-session to work around Replit's proxy cookie issues. The system prioritizes security with Row Level Security (RLS) policies, automatic token refresh, and comprehensive verification across the platform. The system is production-ready with modern best practices.

## System Architecture
The platform is built with Next.js 15.3.3 and Turbopack, using TypeScript and styled with TailwindCSS and Radix UI components. Supabase PostgreSQL serves as the database, with Supabase Auth handling user authentication (Email/Password, OAuth providers). State management is handled with React Context (useAuthContext). AI features are integrated using Google Genkit.

**UI/UX Decisions:**
- Multi-language support with Arabic/English and RTL layout.
- Radix UI primitives are used for UI components, with custom styling.
- Broker form utilizes a multi-step wizard architecture with 11 comprehensive steps.
- KYC verification form is a simplified 2-step flow focusing on document upload without manual data entry.
- Admin document viewer displays all uploaded verification documents (KYC, Address) with extracted data.
- **Unified Country Management System:** Centralized country data with 252 countries including Arabic translations. Uses `CountrySelector` (single) and `MultiCountrySelector` (multi) components. Countries stored as ISO codes (e.g., 'SA', 'AE') in database for consistency. Display names are language-aware (Arabic names in RTL, English in LTR). Components support searchable dropdowns with flag emojis and bilingual placeholders.
- **Unified Phone Input:** Custom `PhoneInputWithCountry` component with integrated country selector showing Arabic country names, dial codes, and flags. Supports filtering to Arab countries only (`onlyArab` prop).

**Technical Implementations & Feature Specifications:**
- User authentication and authorization with Supabase Auth and secure SSR cookie handling, including custom session management with iron-session for Replit compatibility and anti-session-mixing protection.
- Trading account management, including broker integration and a submission/approval workflow.
- Cashback calculation, tracking, and a loyalty points/tier system.
- Referral program with commission tracking.
- **Financial-Grade Ledger System:** ACID-compliant double-entry accounting with PostgreSQL stored procedures, immutable audit trail, and running balance totals. All financial operations (cashback, referrals, withdrawals, orders) use stored procedures with row-level locking. Admin-only server actions with role-based authorization.
- Admin dashboard for comprehensive management of users, brokers, and transactions, including an admin KYC review system with data extraction capabilities.
- Content management features including a blog system with Markdown support.
- E-commerce functionality with a store/marketplace.
- Activity logging for security tracking.
- Geo-location services for user registration via IP detection.

**System Design Choices:**
- **Security-first approach:** Row Level Security (RLS) policies on all database tables, Supabase Auth with SSR, and secure server actions. Implemented production-grade cookie security (`httpOnly: true`, `sameSite: 'strict'`, `secure: true`) and server-side token validation.
- **Server Actions:** All critical user-scoped operations use secure server actions with proper authentication. Mutating ledger operations require admin role verification.
- **Database Design:** PostgreSQL with proper indexing, foreign keys, and ENUM types for data integrity. Schema includes specific column names like `is_active` for `feedback_forms`, `is_enabled` for `offers`, and `status` enums for `users`, `trading_accounts`, and `withdrawals`.
- **Ledger Architecture:** 4 core tables (accounts, transactions, immutable_events, audit_logs) with ACID-safe stored procedures (installed and operational). Available balance formula: `total_earned - total_withdrawn - total_pending_withdrawals - total_orders`. Immutable audit trail prevents modification/deletion of financial records. All procedures use PostgreSQL transactions with row-level locking to ensure financial data integrity.
  - **Order Logic:** Simplified 3-status system (Processing, Confirmed, Cancelled). `total_orders` increases on order submission (Processing status), decreases ONLY when order is cancelled (Processing → Cancelled). Confirmation (Processing → Confirmed) does NOT affect `total_orders`. Cannot cancel Confirmed orders. Cannot confirm Cancelled orders. **Stock management:** Product stock decreases when order is submitted (Processing), increases when order is cancelled (Processing → Cancelled).
  - **Withdrawal Logic:** Uses enum values `withdrawal_processing`, `withdrawal_completed`, `withdrawal_cancelled`. Approval decreases `total_pending_withdrawals` and increases `total_withdrawn`. Rejection decreases `total_pending_withdrawals` only.
  - **Payment Whitelist System:** When admin approves a withdrawal, the payment method and wallet address are automatically saved to `whitelist_payments` table. Subsequent withdrawals are checked against this whitelist and flagged in admin UI if using a new/unwhitelisted payment method (shown with warning icon and card). Uses unique constraint on (user_id, payment_method, wallet_address).
- **Project Structure:** Organized into `src/app` for routes, `src/components` for UI, `src/lib` for utilities, `src/hooks` for custom hooks, `src/types` for TypeScript definitions, and `src/database` for migrations.
- **Authentication System:** Custom session-based authentication with iron-session, automatic token refresh with 5-minute expiry buffer, and session integrity validation.

## External Dependencies
- **Supabase:** PostgreSQL database, Authentication (user auth), Row Level Security.
- **Next.js:** Web framework (15.3.3 with Turbopack).
- **TailwindCSS:** Styling framework.
- **Radix UI:** UI component library.
- **Google Genkit:** AI integration.
- **IPinfo.io:** Geo-location services.