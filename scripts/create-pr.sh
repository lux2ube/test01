#!/bin/bash
# A script to automate creating a pull request from local changes.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Helper Functions ---
function print_info() {
  echo -e "\033[34mℹ $1\033[0m"
}

function print_success() {
  echo -e "\033[32m✅ $1\033[0m"
}

function print_error() {
  echo -e "\033[31m❌ $1\033[0m" >&2
}

# --- Pre-flight Checks ---

# 1. Check for uncommitted changes
if git diff-index --quiet HEAD --; then
  print_info "No local changes to commit. Working directory is clean."
  exit 0
fi
print_info "Local changes detected."

# 2. Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  print_error "GitHub CLI ('gh') is not installed. Please install it to use this script."
  echo "Installation instructions: https://github.com/cli/cli#installation"
  exit 1
fi

# 3. Check if user is logged into GitHub CLI
if ! gh auth status &> /dev/null; then
  print_error "You are not logged into GitHub CLI. Please run 'gh auth login'."
  exit 1
fi
print_info "GitHub CLI is installed and user is authenticated."


# --- Main Workflow ---

# 1. Get user input for commit message and PR title
read -p "Enter a short commit message (e.g., 'Fix login bug'): " COMMIT_MESSAGE
if [ -z "$COMMIT_MESSAGE" ]; then
  print_error "Commit message cannot be empty."
  exit 1
fi

read -p "Enter a title for the Pull Request (press Enter to use commit message): " PR_TITLE
if [ -z "$PR_TITLE" ]; then
  PR_TITLE="$COMMIT_MESSAGE"
fi

# 2. Sync with the remote main branch
print_info "Switching to main branch to sync with remote..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git stash push -m "stashing-for-pr-script"
git checkout main
print_info "Pulling latest changes from origin/main..."
git pull origin main --rebase
git checkout "$CURRENT_BRANCH"
git stash pop || print_info "No changes to unstash."

# 3. Create a unique branch name
BRANCH_NAME="feature/$(git config user.name | tr ' ' '-')-$(date +%s)"
print_info "Creating new branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# 4. Add, commit, and push changes
print_info "Committing changes..."
git add .
git commit -m "$COMMIT_MESSAGE"

print_info "Pushing branch to origin..."
git push --set-upstream origin "$BRANCH_NAME"

# 5. Create the Pull Request
print_info "Creating Pull Request..."
# Use a heredoc to pass the body to the PR create command
PR_URL=$(gh pr create --title "$PR_TITLE" --body "Automated PR created by script." --base main)

if [ $? -eq 0 ]; then
  print_success "Pull Request created successfully!"
  print_info "PR URL: $PR_URL"
  
  # 6. Enable auto-merge on the new PR
  print_info "Enabling auto-merge for the PR..."
  gh pr merge "$PR_URL" --auto --squash
  
  if [ $? -eq 0 ]; then
    print_success "Auto-merge enabled. The PR will merge automatically after checks pass."
  else
    print_error "Failed to enable auto-merge. Please do it manually on GitHub."
  fi
else
  print_error "Failed to create Pull Request."
  exit 1
fi

# 7. Switch back to the main branch and clean up
print_info "Returning to main branch."
git checkout main

print_success "Workflow complete!"
