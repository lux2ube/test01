# Firebase Studio Next.js Starter

This is a Next.js starter project bootstrapped in Firebase Studio.

## Development Workflow

This repository has branch protection rules enabled on the `main` branch. This is a security best practice to prevent accidental changes. You **cannot push directly to `main`**.

To submit your changes, you must use the provided script which automates the process of creating a pull request.

### Submitting Your Changes

1.  **First-Time Setup (Run this once):** Make the script executable by opening your terminal and running this command:
    ```bash
    chmod +x ./scripts/create-pr.sh
    ```

2.  **Save your file changes** in your editor.

3.  **Open the terminal** and run the script:
    ```bash
    ./scripts/create-pr.sh
    ```
4.  **Follow the prompts:**
    *   The script will ask for a short **commit message**. Type a brief description of your changes (e.g., "Fix login bug") and press Enter.
    *   It will then ask for a **Pull Request title**. You can press Enter to use the same text as your commit message.

The script will then automatically create a new branch, push it to GitHub, create a Pull Request, and enable auto-merge. Once all checks pass, your changes will be safely merged into the `main` branch.
# test
