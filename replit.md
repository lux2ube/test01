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
- **Bulk Cashback Import:** Excel file upload with per-record confirmation workflow. Records are validated against approved trading accounts, displayed in a table with status tracking (pending/confirmed/rejected/error), and each record is confirmed individually using the standard `addCashbackTransaction` function which handles ledger updates, notifications, referral commissions, and monthly earnings automatically.
- **Financial Reports System:** Comprehensive admin reporting with filter-based queries. Features: (1) Record type selection (cashback, referral commissions, deposits, withdrawals completed/processing, orders), (2) Cascading filters (user → broker → account) with searchable dropdowns, (3) Date range filtering (from/to), (4) Product filter for store orders, (5) Referral source type filter (cashback vs store_purchase), (6) Data only displays after clicking "Confirm Filter" button, (7) Summary/Detailed view toggle with lazy-loaded detailed records table, (8) Excel export for detailed records with Arabic headers. Queries confirmed records from `cashback_transactions` table (all records are confirmed), `transactions` table with type='referral_commission' for referrals (filtered by metadata.source_type), and `withdrawals` table with appropriate status filters.
- **User Balances Page:** Admin page showing all users with positive available balance using the standard formula: `total_earned + total_deposit - total_withdrawn - total_pending_withdrawals - total_orders`. Displays breakdown of all balance components with summary cards.
- Content management features including a blog system with Markdown support.
- E-commerce functionality with a store/marketplace.
- Activity logging for security tracking.
- Geo-location services for user registration via IP detection.

**System Design Choices:**
- **Security-first approach:** Row Level Security (RLS) policies on all database tables, Supabase Auth with SSR, and secure server actions. Implemented production-grade cookie security (`httpOnly: true`, `sameSite: 'strict'`, `secure: true`) and server-side token validation.
- **Server Actions:** All critical user-scoped operations use secure server actions with proper authentication. Mutating ledger operations require admin role verification.
- **Database Design:** PostgreSQL with proper indexing, foreign keys, and ENUM types for data integrity. Schema includes specific column names like `is_active` for `feedback_forms`, `is_enabled` for `offers`, and `status` enums for `users`, `trading_accounts`, and `withdrawals`.
- **Ledger Architecture:** 4 core tables (accounts, transactions, immutable_events, audit_logs) with ACID-safe stored procedures (installed and operational). Available balance formula: `total_earned + total_deposit - total_withdrawn - total_pending_withdrawals - total_orders`. Immutable audit trail prevents modification/deletion of financial records. All procedures use PostgreSQL transactions with row-level locking to ensure financial data integrity.
  - **Order Logic:** Simplified 3-status system (Processing, Confirmed, Cancelled). `total_orders` increases on order submission (Processing status), decreases ONLY when order is cancelled (Processing → Cancelled). Confirmation (Processing → Confirmed) does NOT affect `total_orders`. Cannot cancel Confirmed orders. Cannot confirm Cancelled orders. **Stock management:** Product stock decreases when order is submitted (Processing), increases when order is cancelled (Processing → Cancelled).
  - **Withdrawal Logic:** Uses enum values `withdrawal_processing`, `withdrawal_completed`, `withdrawal_cancelled`. Approval decreases `total_pending_withdrawals` and increases `total_withdrawn`. Rejection decreases `total_pending_withdrawals` only.
  - **Admin Balance Adjustment:** Admins can decrease user balances for error corrections. Uses the same withdrawal pipeline (create → complete) for consistent ledger totals. SECURITY: Requires Supabase auth validation via `getAuthenticatedUser()` (calls `auth.getUser()`) and admin role verification. Audit trail includes `adjusted_by_admin_id`, `adjusted_by_admin_name` in withdrawal_details and `_actor_id` pointing to admin in ledger metadata.
  - **Deposit System:** Admin-only feature to add funds to user balances. Deposits increase `total_deposit` column (NOT `total_earned`). This keeps deposits separate from cashback/referral earnings. New balance formula: `total_earned + total_deposit - total_withdrawn - total_pending_withdrawals - total_orders`. Uses dedicated `ledger_add_deposit` stored procedure with full audit trail (transactions, immutable_events, audit_logs). SECURITY: Requires Supabase auth validation and admin role verification.
  - **Payment Whitelist System:** When admin approves a withdrawal, ALL payment details are automatically saved to `whitelist_payments` table using a deterministic signature. Signature format: `key=value|key=value` with lowercase keys, case-sensitive values, sorted alphabetically. Subsequent withdrawals are checked against this whitelist using comprehensive matching (all fields must match, not just wallet address). Withdrawals with new/unwhitelisted payment methods are flagged in admin UI (warning icon and card). Uses unique constraint on (user_id, payment_method, payment_signature). Example: crypto payment with wallet + network + memo only matches if all three fields are identical.
- **Project Structure:** Organized into `src/app` for routes, `src/components` for UI, `src/lib` for utilities, `src/hooks` for custom hooks, `src/types` for TypeScript definitions, and `src/database` for migrations.
- **Centralized Site Configuration:** All website details (company name, contact info, social media links, support links, working hours) are stored in `src/lib/site-config.ts` for easy editing. This file can be modified without coding knowledge - just change the values and redeploy.
- **Authentication System:** Custom session-based authentication with iron-session, automatic token refresh with 5-minute expiry buffer, and session integrity validation.
- **Secure Password Reset Flow:** International-standard PKCE flow for password reset. Magic link is verified server-side via `/auth/confirm` route before redirecting to `/reset-password?verified=true`. Security checkpoints: (1) Server-side token verification, (2) Session validation, (3) Password strength enforcement (6+ chars), (4) Password confirmation match, (5) Session invalidation after password change, (6) Secure cookies (httpOnly, sameSite strict, secure), (7) Protection against invalid/expired tokens.

## External Dependencies
- **Supabase:** PostgreSQL database, Authentication (user auth), Row Level Security.
- **Next.js:** Web framework (15.3.3 with Turbopack).
- **TailwindCSS:** Styling framework.
- **Radix UI:** UI component library.
- **Google Genkit:** AI integration.
- **IPinfo.io:** Geo-location services.