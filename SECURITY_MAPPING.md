# Firebase Security Mapping & Implementation

## Overview
This document maps all Firestore database operations in the application and specifies their security mechanism (Firestore Security Rules vs Admin SDK).

---

## Security Strategy

### Client-Accessible Actions (Firestore Rules)
**Actions where users only access their own data**
- Secured via Firestore Security Rules
- `request.auth.uid == resource.data.userId` check
- No server-side token verification needed

### Admin/Privileged Actions (Admin SDK)
**Actions that affect multiple users or require elevated privileges**
- Must use Admin SDK (`adminDb`)
- Require Firebase ID token verification
- Never callable directly from client

---

## Action-to-Security Mapping

### USER ACTIONS (src/app/actions.ts)

| Action | Operation | Scope | Security Mechanism | Justification |
|--------|-----------|-------|-------------------|---------------|
| `handleRegisterUser` | CREATE | users, counters | **Firestore Rules** | User creating own profile. Counter update in transaction is server-controlled. |
| `getClientLevels` | READ | clientLevels | **Firestore Rules** | Public read-only data |
| `getNotificationsForUser` | READ | notifications | **Firestore Rules** | User reading own notifications (`userId == uid`) |
| `markNotificationsAsRead` | UPDATE | notifications | **Firestore Rules** | User updating own notifications |
| `getActiveFeedbackFormForUser` | READ | feedbackForms, feedbackResponses | **Firestore Rules** | Reading active forms (public) and checking own responses |
| `submitFeedbackResponse` | CREATE | feedbackResponses, feedbackForms | **Firestore Rules** | User creating own response, incrementing counter |
| `getProducts` | READ | products | **Firestore Rules** | Public read-only data |
| `getCategories` | READ | productCategories | **Firestore Rules** | Public read-only data |
| `getOrders` | READ | orders | **Firestore Rules** | User reading own orders |
| `getCashbackTransactions` | READ | cashbackTransactions | **Firestore Rules** | User reading own transactions |
| `placeOrder` | CREATE/UPDATE | orders, products, users | **Firestore Rules** | User creating own order. Balance check is calculated server-side. |
| `submitKycData` | UPDATE | users | **Firestore Rules** | User updating own KYC data |
| `submitAddressData` | UPDATE | users | **Firestore Rules** | User updating own address data |
| `updateUserPhoneNumber` | UPDATE | users | **Firestore Rules** | User updating own phone number |
| `getUserBalance` | READ | cashbackTransactions, withdrawals, orders | **Firestore Rules** | User reading own financial data |
| `requestWithdrawal` | CREATE | withdrawals | **Firestore Rules** | User creating own withdrawal request |
| `getTradingAccounts` | READ | tradingAccounts | **Firestore Rules** | Returns all accounts but should be filtered by userId in query |
| `getPublishedBlogPosts` | READ | blogPosts | **Firestore Rules** | Public read-only data (status == 'published') |
| `getBlogPostBySlug` | READ | blogPosts | **Firestore Rules** | Public read-only data (status == 'published') |
| `addBlogPost` | CREATE | blogPosts | **Admin SDK Required** | Should be admin-only |
| `updateBlogPost` | UPDATE | blogPosts | **Admin SDK Required** | Should be admin-only |
| `deleteBlogPost` | DELETE | blogPosts | **Admin SDK Required** | Should be admin-only |

### ADMIN ACTIONS (src/app/admin/actions.ts)

| Action | Operation | Scope | Security Mechanism | Justification |
|--------|-----------|-------|-------------------|---------------|
| `logUserActivity` | CREATE | activityLogs | **Admin SDK** | System-wide logging, called server-side |
| `getActivityLogs` | READ | activityLogs | **Admin SDK** | Admin reading all activity logs |
| `createNotification` | CREATE | notifications | **Admin SDK** | Creating notifications for any user |
| `getUserBalance` | READ | cashbackTransactions, withdrawals, orders | **Admin SDK** | Admin reading any user's balance |
| `awardReferralCommission` | CREATE/UPDATE | cashbackTransactions, users, notifications | **Admin SDK** | System-wide operation affecting multiple users |
| `clawbackReferralCommission` | CREATE/UPDATE | cashbackTransactions, users, notifications | **Admin SDK** | System-wide operation affecting multiple users |
| `getAdminNotifications` | READ | adminNotifications | **Admin SDK** | Admin-only data |
| `sendAdminNotification` | CREATE | adminNotifications, notifications | **Admin SDK** | Admin broadcasting to users |
| `getBannerSettings` | READ | settings | **Firestore Rules** | Can be public or admin-only depending on needs |
| `updateBannerSettings` | UPDATE | settings | **Admin SDK** | Admin-only configuration |

### ADMIN MANAGE ACCOUNTS (src/app/admin/manage-accounts/actions.ts)

| Action | Operation | Scope | Security Mechanism | Justification |
|--------|-----------|-------|-------------------|---------------|
| `getTradingAccounts` | READ | tradingAccounts | **Admin SDK** | Admin reading all trading accounts |
| `updateTradingAccountStatus` | UPDATE | tradingAccounts, users, notifications | **Admin SDK** | Admin approving/rejecting accounts, cross-user operation |
| `adminAddTradingAccount` | CREATE | tradingAccounts, users, notifications | **Admin SDK** | Admin creating account for user |

### ADMIN MANAGE CASHBACK (src/app/admin/manage-cashback/actions.ts)

| Action | Operation | Scope | Security Mechanism | Justification |
|--------|-----------|-------|-------------------|---------------|
| `addCashbackTransaction` | CREATE/UPDATE | cashbackTransactions, users, notifications | **Admin SDK** | Admin adding cashback for users, triggers referral system |
| `getCashbackHistory` | READ | cashbackTransactions, users | **Admin SDK** | Admin reading all cashback history |

### ADMIN MANAGE WITHDRAWALS (src/app/admin/manage-withdrawals/actions.ts)

| Action | Operation | Scope | Security Mechanism | Justification |
|--------|-----------|-------|-------------------|---------------|
| `getWithdrawals` | READ | withdrawals | **Admin SDK** | Admin reading all withdrawal requests |
| `approveWithdrawal` | UPDATE | withdrawals, notifications | **Admin SDK** | Admin approving withdrawals |
| `rejectWithdrawal` | UPDATE | withdrawals, notifications | **Admin SDK** | Admin rejecting withdrawals |

---

## Implementation Status

### ✅ Firestore Security Rules
- [x] Users collection: Own-user read/write + admin override
- [x] User-owned collections: userId field check + admin override
- [x] Public read-only collections: Public read, admin write
- [x] Admin-only collections: Admin-only access

### 🔄 Admin SDK Implementation
- [x] Admin SDK initialized in `src/lib/firebase/admin-config.ts`
- [ ] Token verification helper created
- [ ] Admin actions refactored to use Admin SDK
- [ ] Proper auth middleware for admin routes

### 🔄 Custom Claims
- [ ] Set admin claim for UID: `6yUTvF9JrBQo3GUEqxhUnfleVOE3`
- [ ] Script created: `scripts/set-admin-role.ts`

---

## Admin User Setup

**UID**: `6yUTvF9JrBQo3GUEqxhUnfleVOE3`  
**Email**: `alsabhibassem@gmail.com`  
**Custom Claim**: `{ admin: true }`

Run: `npx tsx scripts/set-admin-role.ts` to grant admin privileges.

---

## Security Notes

1. **Never** expose Admin SDK operations directly to client
2. **Always** verify Firebase ID tokens for admin operations
3. **Use** Firestore Rules for user's own data access
4. **Use** Admin SDK for cross-user or privileged operations
5. **Log** all admin actions in activityLogs collection
