# Maintenance Scripts

This directory contains scripts for performing one-time maintenance tasks on the database.

## `assign-client-ids.ts`

This script is used to retroactively assign a unique, sequential `clientId` to all users in the Firestore database who do not already have one.

### How to Run

1.  **Open a Terminal:** Open a new terminal within your development environment.
2.  **Navigate to the `src` directory:**
    ```bash
    cd src
    ```
3.  **Run the script using `tsx`:** `tsx` is a tool that runs TypeScript files directly.
    ```bash
    npx tsx ./scripts/assign-client-ids.ts
    ```

The script will log its progress in the terminal and let you know when it's complete. It is safe to run multiple times; it will only affect users who are missing a `clientId`.
