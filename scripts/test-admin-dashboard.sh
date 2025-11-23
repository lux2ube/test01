#!/bin/bash

echo "🧪 Testing Admin Dashboard Access..."
echo "=================================="
echo ""

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alsabhibassem@gmail.com","password":"alsabhi0"}' \
  -c /tmp/admin_test_cookies.txt)

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Login successful!"
  
  # Extract redirect URL
  REDIRECT_URL=$(echo "$LOGIN_RESPONSE" | grep -o '"redirectUrl":"[^"]*"' | cut -d'"' -f4)
  echo "Redirect URL: $REDIRECT_URL"
  
  if [ "$REDIRECT_URL" = "/admin/dashboard" ]; then
    echo "✅ Correct redirect URL for admin!"
  else
    echo "❌ Wrong redirect URL: $REDIRECT_URL (expected /admin/dashboard)"
    exit 1
  fi
else
  echo "❌ Login failed!"
  exit 1
fi

echo ""
echo "Step 2: Accessing admin dashboard with cookies..."

# Step 2: Try to access admin dashboard
DASHBOARD_RESPONSE=$(curl -s -L -b /tmp/admin_test_cookies.txt http://localhost:5000/admin/dashboard -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Admin dashboard accessible!"
  
  # Check if it contains admin dashboard elements
  if echo "$DASHBOARD_RESPONSE" | grep -qi "admin\|dashboard"; then
    echo "✅ Response contains admin/dashboard content!"
  else
    echo "⚠️  Response returned 200 but might not be the dashboard"
  fi
else
  echo "❌ Failed to access dashboard (HTTP $HTTP_CODE)"
  exit 1
fi

echo ""
echo "=================================="
echo "✅ ALL TESTS PASSED!"
echo "Admin login and dashboard access working correctly."
