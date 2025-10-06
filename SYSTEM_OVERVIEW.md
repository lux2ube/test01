# System Overview: Registration, Login, and Loyalty

This document explains the current workflow for key user-facing systems in the application.

## 1. User Registration Flow

The registration process is designed to be as simple and reliable as possible. It is handled by the `handleRegisterUser` server action in `src/app/actions.ts`.

**Step-by-Step Process:**

1.  **Data Input:** The user provides their `name`, `email`, and `password` on the `/register` page.
2.  **Create Auth User:** The system first calls `createUserWithEmailAndPassword` to create a new user in **Firebase Authentication**. This step handles password hashing and ensures the email is unique.
3.  **Data Collection (Initial):** In the background, the `getClientSessionInfo` function is called. This function uses the `ipinfo.io` service to get the user's geographical information (specifically their country code, e.g., "US") based on their IP address.
4.  **Create Database Profile:** Immediately after the Auth user is created, a corresponding user profile document is created in the **Firestore `users` collection**. The ID of this document is the user's unique Firebase UID.
5.  **Collected Data:** The new user's Firestore document is populated with the following information:
    *   `uid`: The unique ID from Firebase Auth.
    *   `name`, `email`: Provided by the user.
    *   `role`: Defaults to `"user"`.
    *   `createdAt`: A server timestamp of when the account was created.
    *   `referralCode`: A unique code is generated (e.g., "JOHN123").
    *   `country`: The country code collected in step 3.
    *   `points`, `monthlyPoints`, `tier`, `referredBy`, `referrals`: Initialized to default "zero" values for the loyalty and referral system.
6.  **Security Logging:** A record of the `signup` event is created in the `activityLogs` collection using the `logUserActivity` function. This log includes the user's ID, IP address, country, city, and browser/OS information.
7.  **Result:** If successful, the user is redirected to the `/login` page to perform their first sign-in. This ensures a clean session is established.

---

## 2. User Login Flow

The login process handles both standard email/password and social providers (Google, Apple). It's designed to be resilient, even for users who might have an incomplete registration.

**Step-by-Step Process:**

1.  **User-End Action:** The user either enters their credentials on the `/login` page or clicks a social login button.
2.  **Firebase Authentication:** The system calls either `signInWithEmailAndPassword` or `signInWithPopup`. Firebase handles the verification securely.
3.  **Login Success & Self-Healing:** If authentication is successful, the `handleLoginSuccess` function is triggered. This is a critical step:
    *   It fetches the user's profile from the Firestore `users` collection.
    *   **Self-Healing Check:** It explicitly checks if the document exists. If a user was created in Auth but their database profile is missing (due to a past error), the system **automatically creates a complete user profile for them on the spot**. This fixes accounts for users who were previously stuck.
    *   If a profile was created via self-healing, it's logged as a `signup` event.
4.  **Security Logging:** For all successful logins, a `login` event is recorded in the `activityLogs` collection with the user's device and location info.
5.  **Session Management:** The `useAuthContext` provider updates its state with the complete user profile (Auth data + Firestore data).
6.  **Redirection:** The user is redirected to their appropriate dashboard (`/admin/dashboard` for admins, `/dashboard` for regular users).

---

## 3. Loyalty System (Points & Tiers)

The loyalty system is currently based on points and tiers. The core logic is present but is not fully integrated into all user actions yet.

**How it Works Now:**

1.  **User Profile Fields:** Every user has four key fields in their Firestore document to track loyalty:
    *   `points`: The user's lifetime total points.
    *   `monthlyPoints`: A separate counter for points earned in the current month. This is used for tier evaluation.
    *   `tier`: The user's current loyalty tier (e.g., 'New', 'Bronze', 'Silver').
    *   `referralCommissionPercent`, `storeDiscountPercent`: These are placeholders on the user object for future tier-based benefits.

2.  **Earning Points:** Points are awarded via the `awardPoints` function in `src/app/admin/actions.ts`. This function is designed to be called **inside other Firestore transactions**.
    *   **Current Implementation:** Points are currently only awarded in three specific scenarios:
        1.  `approve_account`: When an admin approves a user's trading account.
        2.  `cashback_earned`: When an admin adds a cashback transaction for the user.
        3.  `store_purchase`: When a user successfully places an order in the store.
    *   The `awardPoints` function is **not** currently called during registration (`user_signup_pts`) or referral actions. This was a deliberate simplification to ensure registration stability.

3.  **Tier Management:**
    *   A user's `tier` is initialized to `'New'` upon registration.
    *   There is **no automatic process** to upgrade or downgrade a user's tier based on their `monthlyPoints`. This logic would need to be implemented as a separate, scheduled function (e.g., a monthly cron job).
    *   The configuration for how many points are needed for each tier is stored in the `getLoyaltyTiers` function in `src/app/admin/actions.ts`.
