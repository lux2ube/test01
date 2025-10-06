# Admin Scripts

This directory contains administrative scripts for managing the Firebase backend.

## Scripts

### set-admin-role.ts

Grants admin privileges to a specific user by setting a custom claim on their Firebase Auth account.

**Usage:**
```bash
npx tsx scripts/set-admin-role.ts
```

**What it does:**
- Sets the `admin: true` custom claim for UID `6yUTvF9JrBQo3GUEqxhUnfleVOE3`
- Verifies the user exists before setting the claim
- Displays the updated custom claims

**Important:** The user must sign out and sign back in for the admin claim to take effect in their ID token.

**Configured for:**
- UID: `6yUTvF9JrBQo3GUEqxhUnfleVOE3`
- Email: `alsabhibassem@gmail.com`

### assign-client-ids.ts

Assigns sequential client IDs to users who don't have one.

**Usage:**
```bash
npx tsx scripts/assign-client-ids.ts
```

### seed-loyalty-rules.ts

Seeds the loyalty tiers/rules configuration in Firestore.

**Usage:**
```bash
npx tsx scripts/seed-loyalty-rules.ts
```

### list-admins.ts

Lists all users who have the admin custom claim.

**Usage:**
```bash
npx tsx scripts/list-admins.ts
```

## Requirements

All scripts require:
- Firebase Admin SDK credentials (set via `FIREBASE_SERVICE_ACCOUNT_KEY_B64` environment variable)
- `tsx` package (included in devDependencies)

## Security

- These scripts use the Firebase Admin SDK which has elevated privileges
- Only run these scripts in secure environments
- Never expose Admin SDK credentials
- Scripts are for server-side use only
