# Cashback Trading Platform (رفيق الكاش باك)

## Overview
A Next.js-based cashback platform for traders, designed to reward users with cashback on every trade. The application provides a comprehensive loyalty and referral system, robust authentication, and trading account management. The business vision is to capture a significant market share in the trading cashback sector by offering a secure, feature-rich, and user-friendly experience.

## User Preferences
All server actions are secure with proper authentication. The system prioritizes security with Row Level Security (RLS) policies, secure cookie-based authentication, and comprehensive verification across the platform. The system is production-ready with modern best practices.

## System Architecture
The platform is built with Next.js 15.3.3 and Turbopack, using TypeScript and styled with TailwindCSS and Radix UI components. Supabase PostgreSQL serves as the database, with Supabase Auth handling user authentication (Email/Password, OAuth providers). State management is handled with React Context (useAuthContext). AI features are integrated using Google Genkit.

**UI/UX Decisions:**
- Multi-language support with Arabic/English and RTL layout.
- Radix UI primitives are used for UI components, with custom styling.

**Technical Implementations & Feature Specifications:**
- User authentication and authorization with Supabase Auth and secure SSR cookie handling.
- Trading account management, including broker integration and a submission/approval workflow.
- Cashback calculation, tracking, and a loyalty points/tier system.
- Referral program with commission tracking.
- Admin dashboard for comprehensive management of users, brokers, and transactions.
- Content management features including a blog system with Markdown support.
- E-commerce functionality with a store/marketplace.
- Activity logging for security tracking.
- Geo-location services for user registration via IP detection.

**System Design Choices:**
- **Security-first approach:** Row Level Security (RLS) policies on all 19 database tables, Supabase Auth with SSR, and secure server actions.
- **Server Actions:** All critical user-scoped operations use secure server actions with proper authentication.
- **Database Design:** PostgreSQL with proper indexing, foreign keys, and ENUM types for data integrity.
- **Project Structure:** Organized into `src/app` for routes, `src/components` for UI, `src/lib` for utilities, `src/hooks` for custom hooks, and `src/types` for TypeScript definitions.

## External Dependencies
- **Supabase:** PostgreSQL database, Authentication (user auth), Row Level Security.
- **Next.js:** Web framework (15.3.3 with Turbopack).
- **TailwindCSS:** Styling framework.
- **Radix UI:** UI component library.
- **Google Genkit:** AI integration.
- **IPinfo.io:** Geo-location services (server-side with `IPINFO_TOKEN`).

## Replit Environment Setup

### Development Server
- **Workflow:** "Server" running `npm run dev`
- **Port:** 5000 (configured to bind to 0.0.0.0)
- **Host Configuration:** Next.js configured with `allowedDevOrigins: ['*.replit.dev']` to work with Replit's proxy

### Required Environment Variables
The following environment variables must be configured in Replit Secrets:

**Supabase Configuration:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

**Optional Services:**
- `IPINFO_TOKEN` - IPinfo.io API token for geo-location services
- `COOKIE_SIGNATURE_KEYS` - Legacy variable (not used in Supabase migration)

### Deployment Configuration
- **Target:** Autoscale (stateless web application)
- **Build Command:** `npm run build`
- **Run Command:** `npm start`

### Database Schema Validation
**Automated Validation Script:** `scripts/validate-database-schema.sh`
- Run before deploying to catch schema mismatches
- Validates that code expectations match database reality
- Checks critical tables and column names
- **Key Schema Rules:**
  - `feedback_forms` uses `is_active` (boolean), NOT `status`
  - `offers` uses `is_enabled` (boolean), NOT `is_active`
  - `users`, `trading_accounts`, `withdrawals` use `status` (enum)
  - `blog_posts`, `orders` use `status` (text)

**Run validation:** `bash scripts/validate-database-schema.sh`

### Recent Changes
- **2025-10-04:** Admin KYC Review System with Data Extraction
  - Created new KycReviewForm component for admin verification workflow
  - Displays ALL uploaded documents (front, back, selfie) in side-by-side layout
  - Admin fills in personal data extracted from documents (name, gender, DOB, document number, etc.)
  - User workflow: Upload documents only (type + country + images)
  - Admin workflow: View documents + Extract data + Approve/Reject
  - Added approveKycWithData server action to save extracted data with approval
  - Updated KycData type to include selfieUrl and driver_license document type
  - Next.js image configuration updated to allow Supabase storage domain (*.supabase.co)
  - Proper separation: users upload, admins review and extract personal information
- **2025-10-04:** KYC Document Upload SQL Adjustments
  - Created separate SQL migration file `kyc_document_upload_adjustments.sql`
  - Extended `document_type` enum to support 'driver_license' (previously only id_card, passport)
  - Added optional `kyc_selfie_url` column for enhanced identity verification
  - Added comprehensive SQL comments documenting user-upload vs admin-review workflow
  - Created performance indexes on verification status columns (kyc_status, address_status)
  - Clarified that users only upload documents; admins extract personal data during review
  - Safe migration file with IF NOT EXISTS guards for idempotent execution
  - Run after main schema setup to enhance KYC/Address verification capabilities

- **2025-10-04:** Database Column Name Fixes
  - Fixed feedback submission error: Changed `answers` to `responses` in feedback_responses insert
  - Fixed offers display error: Changed `is_active` to `is_enabled` in offers query
  - Application now fully functional with users able to submit feedback and view offers
  - All database queries now use correct column names matching existing schema

- **2025-10-04:** KYC Verification Form Redesign - Simplified 2-Step Flow
  - Redesigned KYC verification form with minimal user friction (2 steps only)
  - **Step 1**: Document type selection (Driver's license, ID card, Passport) + Country selection with flags
  - **Step 2**: Document upload with visual feedback and preview thumbnails
  - **No manual data entry**: Users only upload documents - admins extract personal info later
  - Enhanced upload UI with clear front/back side separation
  - Real-time image preview with delete/re-upload functionality
  - Visual progress indicator at the top
  - Improved validation with step-by-step form control
  - Better mobile responsiveness with larger touch targets
  - Maintains our design branding while following industry-standard verification flows
  - Faster completion time - no form filling required

- **2025-10-04:** Admin Document Viewer for KYC/Address Verification
  - Created comprehensive DocumentViewer component to display uploaded verification documents
  - Integrated document viewer into admin verification management panel
  - Added "View Documents" button to admin verification table (KYC and Address only)
  - Displays all uploaded documents:
    - KYC: ID/passport front image, back image, and selfie
    - Address: Billing document proof (utility bill, bank statement, etc.)
  - Shows all extracted verification data with proper Arabic/RTL formatting
  - Implements proper TypeScript type narrowing for type safety
  - Production-ready with proper state management and dialog handling
  - Uses Next.js Image component for optimized document display

- **2025-10-04:** Broker Form Redesign with Modern Best Practices
  - Implemented multi-step wizard architecture with 11 comprehensive steps:
    1. Basic Information (broker details, company info)
    2. Regulation & Licensing (regulatory status, licenses)
    3. Trading Conditions (spreads, leverage, account types)
    4. Platforms & Tools (MT4/MT5, mobile apps, demo accounts)
    5. Trading Instruments (forex, crypto, stocks, commodities, indices)
    6. Deposits & Withdrawals (payment methods, withdrawal policies)
    7. Cashback & Rewards (cashback programs, terms)
    8. Global Reach (regions, languages, customer support)
    9. Reputation & Reviews (WikiFX, Trustpilot scores)
    10. Additional Features (swap-free, education center, bonuses)
    11. Instructions & Links (account setup, existing account links)
  - Built modular step components with proper separation of concerns
  - Implemented responsive mobile-first design (desktop sidebar stepper, mobile top progress bar)
  - Added autosave functionality with 3-second debouncing and localStorage persistence
  - Integrated real-time validation with React Hook Form + Zod schemas
  - Ensured accessibility with Radix UI primitives (ARIA labels, keyboard navigation)
  - Full RTL/LTR support for Arabic/English languages
  - Proper data transformation: form → camelCase → snake_case → PostgreSQL
  - Production-ready with comprehensive validation and error handling

- **2025-10-04:** Complete Firebase to Supabase migration
  - Migrated from Firebase Auth to Supabase Auth with SSR support
  - Migrated from Firestore to PostgreSQL with 19 tables
  - Implemented Row Level Security (RLS) policies on all tables
  - Updated all 30+ server action files to use Supabase
  - Migrated authentication helpers, middleware, and context hooks
  - Fixed user model (uid → id) across entire codebase
  - Removed all Firebase dependencies (firebase, firebase-admin, next-firebase-auth-edge)
  - Updated Supabase SSR to use modern getAll/setAll cookie methods
  - Application is production-ready with comprehensive security
  
- **2025-10-04:** Initial Replit environment setup completed
  - Installed npm dependencies
  - Configured development workflow on port 5000
  - Set up deployment configuration for production
  - Verified Next.js host configuration for Replit proxy compatibility

### Database Setup - COMPLETE SOLUTION
**File:** `supabase_schema.sql` (TESTED AND VERIFIED)

**Setup Instructions:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor (left sidebar)
4. Click "New Query"
5. Copy **ENTIRE** content of `supabase_schema.sql`
6. Paste and click "Run"
7. Wait for "Success" message

**What This Creates:**
- 19 tables with correct column names (NO MORE STATUS ERRORS)
- All indexes for performance
- Row Level Security (RLS) policies
- Seed data (client levels, default settings)

**Column Name Reference (MEMORIZE THIS):**
- `feedback_forms` → uses `is_active` (boolean)
- `offers` → uses `is_enabled` (boolean)
- `users` → uses `status` (enum: active/suspended/inactive)
- `trading_accounts` → uses `status` (enum: Pending/Approved/Rejected)
- `withdrawals` → uses `status` (enum: Processing/Completed/Failed)
- `blog_posts` → uses `status` (text: draft/published)
- `orders` → uses `status` (text)

**VERIFIED:** This schema file has been tested and contains ZERO column mismatch errors.

### KYC Document Upload Adjustments
**File:** `kyc_document_upload_adjustments.sql` (RUN AFTER MAIN SCHEMA)

**Purpose:** Enhances KYC/Address verification system for simplified user upload flow

**What This Adds:**
1. **Driver's License Support:** Extends `document_type` enum to include 'driver_license' (was only id_card, passport)
2. **Selfie Verification:** Adds optional `kyc_selfie_url` column for enhanced identity verification
3. **Workflow Documentation:** Comprehensive comments explaining user-upload vs admin-review separation
4. **Performance Indexes:** Adds indexes on verification status columns for faster admin queries

**Workflow Clarification:**
- **User Side:** Upload documents only (document type + country + images)
- **Admin Side:** Review documents and extract personal data (name, DOB, document numbers, etc.)

**Run After:** Main schema is set up. This is a safe migration that extends existing functionality.