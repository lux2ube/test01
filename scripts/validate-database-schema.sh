#!/bin/bash
# Database Schema Validation Script
# Prevents code/database column mismatches
#
# Run this before deploying or after schema changes:
# bash scripts/validate-database-schema.sh

set -e

echo "🔍 Validating Database Schema..."
echo ""

# Check if database is accessible
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

echo "✅ Database connection configured"
echo ""

# Validate critical tables exist
echo "📊 Checking required tables..."
REQUIRED_TABLES=("users" "trading_accounts" "withdrawals" "feedback_forms" "offers" "notifications")

for table in "${REQUIRED_TABLES[@]}"; do
    COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" 2>/dev/null || echo "0")
    if [ "$COUNT" -eq "0" ]; then
        echo "❌ ERROR: Table '$table' does not exist"
        exit 1
    else
        echo "✅ $table"
    fi
done

echo ""
echo "🔍 Checking column consistency..."

# Check feedback_forms - should have is_active, NOT status
HAS_STATUS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'feedback_forms' AND column_name = 'status';" 2>/dev/null || echo "0")
HAS_IS_ACTIVE=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'feedback_forms' AND column_name = 'is_active';" 2>/dev/null || echo "0")

if [ "$HAS_STATUS" -ne "0" ]; then
    echo "⚠️  WARNING: feedback_forms has 'status' column (unexpected)"
fi

if [ "$HAS_IS_ACTIVE" -eq "0" ]; then
    echo "❌ ERROR: feedback_forms missing 'is_active' column"
    exit 1
else
    echo "✅ feedback_forms.is_active exists"
fi

# Check offers - should have is_enabled, NOT is_active
HAS_IS_ENABLED=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'is_enabled';" 2>/dev/null || echo "0")

if [ "$HAS_IS_ENABLED" -eq "0" ]; then
    echo "❌ ERROR: offers missing 'is_enabled' column"
    exit 1
else
    echo "✅ offers.is_enabled exists"
fi

# Check users table has required KYC columns
REQUIRED_USER_COLUMNS=("kyc_status" "kyc_nationality" "address_status")
for col in "${REQUIRED_USER_COLUMNS[@]}"; do
    HAS_COL=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = '$col';" 2>/dev/null || echo "0")
    if [ "$HAS_COL" -eq "0" ]; then
        echo "❌ ERROR: users.$col does not exist"
        exit 1
    else
        echo "✅ users.$col exists"
    fi
done

echo ""
echo "✅ All schema validations passed!"
echo ""
echo "📋 Status Column Summary:"
psql $DATABASE_URL -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND column_name IN ('status', 'is_active', 'is_enabled') ORDER BY table_name, column_name;"
