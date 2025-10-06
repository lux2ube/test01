# CRITICAL SECURITY ISSUES - IMMEDIATE ACTION REQUIRED

## **Status**: 🔴 CRITICAL - System has severe security vulnerabilities

## Critical Finding

**All user-scoped server actions currently trust client-supplied `userId` parameters without verification.** This means a malicious user can access ANY other user's data by simply changing the userId parameter.

### Vulnerable Functions (Priority: CRITICAL)
The following functions accept userId from the client without verification:

1. `getNotificationsForUser(userId)` - Access any user's notifications
2. `getUserTradingAccounts(userId)` - Access any user's trading accounts  
3. `getCashbackTransactions(userId)` - Access any user's transaction history
4. `getWalletHistory(userId)` - Access any user's withdrawal history
5. `getActiveFeedbackFormForUser(userId)` - Access any user's feedback data
6. `submitFeedbackResponse(userId, ...)` - Submit feedback as any user
7. `getUserBalance(userId)` - Access any user's balance
8. `getUserActivityLogs(userId)` - Access any user's activity logs

### Additional Issues

1. **Client SDK in Server Actions** - Functions using client Firestore SDK in server actions:
   - `markNotificationsAsRead()` - uses `writeBatch(db)`
   - `submitFeedbackResponse()` - uses `runTransaction(db)`
   - These fail because server actions have no auth context for Firestore rules

2. **Inconsistent Timestamp Handling** - Mixing `new Date()`, `Timestamp.now()`, and `serverTimestamp()`

## Recommended Solutions

### Option 1: Quick Fix (Band-Aid) ⚠️
Pass ID tokens from client and verify server-side. Still requires client cooperation.

**Implementation:**
```typescript
// Client side
const idToken = await auth.currentUser?.getIdToken();
await serverAction(idToken);

// Server side  
import { verifyClientIdToken } from '@/lib/auth-helpers';
const decodedToken = await verifyClientIdToken(idToken);
const userId = decodedToken.uid; // Now verified!
```

### Option 2: Proper Solution (Recommended) ✅
Implement **`next-firebase-auth-edge`** with cookie-based authentication.

**Why This is Better:**
- Server-side authentication via HTTP-only cookies
- No client-side token passing required
- Automatic token refresh
- Works with Edge Runtime
- Industry best practice for Next.js + Firebase in 2025

**Implementation Scope:**
1. Install `next-firebase-auth-edge`
2. Add middleware for cookie management
3. Update all server actions to use `getTokens()` instead of accepting userId
4. Update login/logout flows to use session cookies
5. Remove all userId parameters from server actions

**Estimated Effort:** 4-6 hours for complete implementation

## Immediate Actions Required

### Phase 1: Stop the Bleeding (1-2 hours)
1. ✅ Document all vulnerable functions
2. ⬜ Add warning banners to dashboard for admin users
3. ⬜ Implement temporary rate limiting on server actions
4. ⬜ Add audit logging for all data access

### Phase 2: Quick Security Fix (2-3 hours)  
1. ⬜ Update `useAuthContext` to provide `getIdToken` helper
2. ⬜ Update all vulnerable server actions to accept and verify ID tokens
3. ⬜ Convert client SDK operations to Admin SDK in server actions
4. ⬜ Test all authentication flows

### Phase 3: Proper Implementation (4-6 hours)
1. ⬜ Install and configure `next-firebase-auth-edge`
2. ⬜ Implement middleware for cookie-based authentication
3. ⬜ Refactor all server actions to use `getTokens()`
4. ⬜ Update login/register/logout flows
5. ⬜ Remove temporary ID token passing
6. ⬜ Full security audit and testing

## Testing Requirements

Before considering this fixed:
1. ✅ Verify server actions reject requests without valid auth
2. ⬜ Confirm users cannot access other users' data
3. ⬜ Test token expiry and refresh flows  
4. ⬜ Verify admin-only actions require admin claim
5. ⬜ Load test with multiple concurrent users
6. ⬜ Security audit by external party

## References

- [next-firebase-auth-edge Documentation](https://next-firebase-auth-edge-docs.vercel.app)
- [Firebase Admin SDK Security](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** 2025-09-30  
**Severity:** CRITICAL  
**Status:** UNRESOLVED  
**Assigned To:** Platform Administrator
