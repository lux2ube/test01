# Google Login Setup Instructions

## Your Current Replit URL
```
https://853b8358-aadf-4e94-9f07-661cc3bcc748-00-1qad1gg61aalc.kirk.replit.dev
```

---

## ✅ WHAT YOU NEED TO DO (No coding required)

### Step 1: Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth client: **"Supabase Authentication"**
3. Under **"Authorized JavaScript origins"** → Add this:
   ```
   https://853b8358-aadf-4e94-9f07-661cc3bcc748-00-1qad1gg61aalc.kirk.replit.dev
   ```
4. Click **"Save"**
5. ⏳ **Wait 5-10 minutes** for changes to take effect

### Step 2: Update Supabase URL Configuration

1. Go to: https://supabase.com/dashboard/project/erhfmgmyfnhcpxkjdkvt/auth/url-configuration
2. **Site URL** - Change to:
   ```
   https://853b8358-aadf-4e94-9f07-661cc3bcc748-00-1qad1gg61aalc.kirk.replit.dev
   ```
3. **Redirect URLs** - Add this line:
   ```
   https://853b8358-aadf-4e94-9f07-661cc3bcc748-00-1qad1gg61aalc.kirk.replit.dev/auth/callback
   ```
4. Click **"Save changes"**

### Step 3: Test Google Login

1. After 10 minutes, visit your app login page
2. Click the Google login button
3. It should now work!

---

## ⚙️ WHAT THE SYSTEM WILL DO

- ✅ Your app code is already set up correctly
- ✅ Auth callback route exists and is ready
- ✅ Environment variables are configured
- ✅ Just waiting for you to update Google & Supabase settings

---

## Troubleshooting

**If Google login still doesn't work after 15 minutes:**
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Do a hard refresh (Ctrl+Shift+R)
3. Try again

**If you see error about "Redirect URL mismatch":**
- Make sure the redirect URL in Supabase exactly matches:
  `https://853b8358-aadf-4e94-9f07-661cc3bcc748-00-1qad1gg61aalc.kirk.replit.dev/auth/callback`
