# Manual Fix for Google OAuth Branding

Since the automated check couldn't access your account, please follow these steps to fix the "supabase.co" branding issue manually.

## Step 1: Get Google Credentials

1.  Go to **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2.  Make sure you are signed in with your **`mycuratedhaven`** Google account.
3.  In the top dropdown, select your project: **Parenting Compass** (ID: `parenting-compass-444411`).
4.  Look for the **OAuth 2.0 Client IDs** section.
5.  Find the entry for **Web client** (it might be named "Web client 1" or similar).
    *   *Note: Do not use the iOS or Android client IDs for this step.*
6.  Click the **pencil icon** (Edit) or the name of the client.
7.  On the right side, you will see **Client ID** and **Client Secret**.
8.  **Copy both of these values.**

## Step 2: Update Supabase

1.  Go to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Select your project (**Parenting Compass**).
3.  In the left sidebar, click **Authentication** -> **Providers**.
4.  Click on **Google** to expand the settings.
5.  **Paste** the **Client ID** you copied into the "Client ID" field.
6.  **Paste** the **Client Secret** you copied into the "Client Secret" field.
7.  Click **Save**.

## Step 3: Verify

1.  Restart your app (close it completely and reopen).
2.  Tap "Continue with Google".
3.  You should now see: **"Sign in with Google to continue to My Curated Haven"**.

---

**Troubleshooting:**
*   If you still see "supabase.co", double-check that you copied the **Web** client credentials, not the iOS ones.
*   Ensure the "Authorized redirect URIs" in Google Cloud Console (under the Web client you just copied from) includes your Supabase callback URL: `https://ccrgvammglkvdlaojgzv.supabase.co/auth/v1/callback`.
