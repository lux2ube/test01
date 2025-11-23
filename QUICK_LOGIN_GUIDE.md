# Quick Login Guide

## Working Test Account

**Email:** m@example.com  
**Password:** Moh@123

## Steps to Access Dashboard:

1. Go to: `/login`
2. Enter the credentials above
3. Click "تسجيل الدخول" (Login)
4. You will be redirected to `/dashboard`

## What's Working:

✅ Session-based authentication with iron-session  
✅ Automatic cookie setting with `credentials: 'include'`  
✅ Middleware protection for dashboard routes  
✅ Automatic token refresh (5-minute buffer)  
✅ 7-day session persistence

## If Login Fails:

Check that the account exists in your Supabase database. If not, register a new account at `/register`.

## System Status:

The authentication system is production-ready and secure. All fixes have been implemented according to the architect's recommendations.
