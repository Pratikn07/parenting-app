# Fix Google OAuth Branding - Show "My Curated Haven" Instead of Supabase URL

## Problem
When users sign in with Google, they see "to continue to ccrgvammglkvdlaojgzv.supabase.co" instead of your app name "My Curated Haven".

## Solution: Update Google Cloud Console OAuth Consent Screen

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account you used to create the OAuth app
3. Select your project (the one with your OAuth credentials)

### Step 2: Navigate to OAuth Consent Screen

1. In the left sidebar, click **APIs & Services**
2. Click **OAuth consent screen**

### Step 3: Update Application Information

Update the following fields:

#### Required Fields:
- **App name**: `My Curated Haven`
- **User support email**: Your email address
- **Developer contact information**: Your email address

#### Recommended Fields:
- **App logo**: Upload your app icon (120x120px minimum)
  - Location: `/Users/pratik.nandoskar/Documents/ios_app/parenting_app/assets/images/icon.png`
- **Application home page**: Your website or app store link (optional)
- **Application privacy policy link**: Your privacy policy URL (optional for testing)
- **Application terms of service link**: Your terms URL (optional for testing)

### Step 4: Update Scopes (if needed)

Make sure you have these scopes enabled:
- `userinfo.email`
- `userinfo.profile`
- `openid`

### Step 5: Save Changes

1. Click **Save and Continue**
2. Review your changes
3. Click **Back to Dashboard**

### Step 6: Test the Changes

1. Delete the app from your iOS simulator/device
2. Reinstall and run: `npx expo run:ios`
3. Try signing in with Google
4. You should now see "Sign in with Google to continue to **My Curated Haven**"

## Alternative: Verify Current OAuth App Name

If you've already set the app name but it's not showing:

1. Check **OAuth consent screen** → **App information**
2. Verify the **App name** is set to "My Curated Haven"
3. Make sure the app is in **Testing** or **Production** mode
4. If in Testing mode, ensure your Google account is added to **Test users**

## Note About Supabase URL

The Supabase URL (`ccrgvammglkvdlaojgzv.supabase.co`) will still appear in:
- The redirect URI (this is normal and secure)
- Browser address bar during OAuth flow

However, the main consent screen will show your app name instead.

## Advanced: Custom Domain (Optional)

For a fully branded experience:

1. Purchase a custom domain (e.g., `mycuratedhaven.com`)
2. In Supabase Dashboard → **Settings** → **Custom Domains**
3. Add your custom domain
4. Update DNS records as instructed
5. Update Google OAuth redirect URIs to use your custom domain
6. Update `redirectTo` in `SupabaseAuthService.ts` line 117

This will replace the Supabase URL entirely with your own domain.

---

**Quick Fix**: Just update the **App name** in Google Cloud Console OAuth consent screen to "My Curated Haven"
