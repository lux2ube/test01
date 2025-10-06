
# Project Code Documentation

This document provides a detailed explanation of the project's source code, file by file. It is intended to help developers understand the application's structure, logic, and dependencies for long-term maintenance.

---

## 1. File Name: `src/app/actions.ts`

**Short description:** This file contains the primary server-side functions (Next.js Server Actions) that handle core application logic, such as user management and AI-powered calculations.

## 2. Overall Role

This file acts as the bridge between the user interface (client-side components) and the backend services (Firebase, Genkit AI). It exposes secure, callable functions that can be used directly from React components without needing to create separate API endpoints. Its main responsibilities include handling user registration, managing user logout, and executing Genkit AI flows for business logic. It directly interacts with `firebase/config.ts` for database and authentication services and with the AI flows defined in `src/ai/flows/`.

## 3. Line-by-Line / Block Explanation

#### **Block: Imports**
```typescript
'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { generateReferralCode } from "@/lib/referral";
import { logUserActivity } from "./admin/actions";
import { getClientSessionInfo } from "@/lib/device-info";
```
**Explanation:**
- `'use server';`: Declares that all functions in this file are Next.js Server Actions, meaning they execute exclusively on the server.
- `import ... from "@/ai/flows/...";`: Imports the AI-powered functions (`generateProjectSummary`, `calculateCashback`) and their associated data types from the Genkit flows.
- `import ... from "@/lib/firebase/config";`: Imports the initialized Firebase authentication (`auth`) and Firestore database (`db`) instances.
- `import ... from "firebase/auth";`: Imports specific functions from the Firebase Auth SDK for user creation and sign-out.
- `import ... from "firebase/firestore";`: Imports specific functions from the Firestore SDK for database operations like creating documents (`setDoc`).
- `import { generateReferralCode } from "@/lib/referral";`: Imports a helper function to create a referral code for a new user.
- `import { logUserActivity } from "./admin/actions";`: Imports the function used for logging user security events.
- `import { getClientSessionInfo } from "@/lib/device-info";`: Imports a utility to get the user's device and location information for logging.


#### **Block: `handleRegisterUser` Function**
```typescript
export async function handleRegisterUser(formData: { name: string, email: string, password: string }) {
    const { name, email, password } = formData;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            role: "user",
            createdAt: Timestamp.now(),
            referralCode: generateReferralCode(name),
            referredBy: null,
            referrals: [],
            points: 0,
            tier: 'New',
            monthlyPoints: 0,
        });
        
        return { success: true, userId: user.uid };

    } catch (error: any) {
        console.error("Registration Error: ", error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: "This email is already in use. Please log in." };
        }
        return { success: false, error: "An unexpected error occurred during registration." };
    }
}
```
**Explanation:**
- `export async function handleRegisterUser(...)`: Defines an asynchronous server action that accepts user registration data.
- `const { name, email, password } = formData;`: Destructures the input object to get individual fields.
- `const userCredential = await createUserWithEmailAndPassword(auth, email, password);`: Creates a new user in the Firebase Authentication system. This is the first critical step. If this fails (e.g., weak password, email already exists), it will throw an error.
- `const user = userCredential.user;`: Extracts the newly created user object, which contains the unique user ID (`uid`).
- `await setDoc(doc(db, "users", user.uid), { ... });`: Creates a new document in the `users` collection in Firestore. The document's ID is set to the new user's `uid`, linking the Auth record to the database profile.
- `{ uid: user.uid, name, email, ... }`: This object defines the initial data for the user's profile, including their name, email, role, and default values for loyalty and referral features.
- `return { success: true, userId: user.uid };`: If both user creation and profile creation succeed, it returns a success object with the new user's ID.
- `catch (error: any)`: Catches any errors that occur during the process.
- `if (error.code === 'auth/email-already-in-use')`: Specifically checks if the error was because the email is already registered.
- `return { success: false, error: "..." };`: Returns a structured error object to the client, providing a user-friendly message.

#### **Block: `handleLogout` Function**
```typescript
export async function handleLogout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout Error: ", error);
        return { success: false, error: "Failed to log out." };
    }
}
```
**Explanation:**
- `export async function handleLogout()`: Defines an asynchronous server action to handle user logout.
- `await signOut(auth);`: Calls the Firebase SDK function to sign the current user out, clearing their session from the client.
- `return { success: true };`: Returns a success object if the sign-out is successful.
- `catch (error) { ... }`: Catches any potential errors during the sign-out process and returns a failure object.

## 4. Important Notes

- **'use server' Directive:** This is crucial. It ensures this code only ever runs on the server, protecting sensitive logic and environment variables from being exposed to the client's browser.
- **Simplified Registration:** The `handleRegisterUser` function is intentionally simplified to ensure maximum reliability. It performs only the two most critical steps: creating the auth user and the database profile. More complex logic (like awarding referral points) was removed from this initial step to prevent transactional failures that were causing the "unexpected error".
- **Error Handling:** The `try...catch` blocks are essential for providing clear feedback to the user. Instead of the app crashing or showing a generic error, it can now display a specific message like "This email is already in use."

## 5. Summary

This file is the central hub for server-side user actions. It securely handles new user registration by creating both an authentication entry and a database profile, and provides a reliable mechanism for users to log out.

---
