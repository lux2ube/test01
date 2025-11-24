#!/bin/bash

echo "📚 Ledger Migration Installer"
echo "============================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check for required env vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing environment variables"
    echo "   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔗 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/.*https:\/\/\([^.]*\)\.supabase\.co.*/\1/p')

echo "📊 Project Reference: $PROJECT_REF"
echo ""
echo "⚠️  IMPORTANT: You need to run the SQL manually in Supabase Dashboard"
echo ""
echo "📝 Instructions:"
echo "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "   2. Open this file in your editor: attached_assets/PROCEDURES_ONLY_1763944454233.sql"
echo "   3. Select all content (Ctrl+A / Cmd+A)"
echo "   4. Copy it (Ctrl+C / Cmd+C)"
echo "   5. Paste it into the SQL Editor"
echo "   6. Click 'RUN' button"
echo ""
echo "🔗 Direct link: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "✅ Once done, test by adding cashback to a user!"
