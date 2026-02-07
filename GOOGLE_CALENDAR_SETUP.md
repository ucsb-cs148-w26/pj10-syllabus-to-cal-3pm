# Google Calendar API Setup Guide

This guide will help you set up Google OAuth credentials for the Google Calendar integration.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: (any name, e.g., "Syllabus Calendar App")

5. **IMPORTANT: Add Authorized Redirect URIs:**
   - For local development:
     ```
     http://localhost:3000/api/auth/callback
     ```
   - For production (Vercel):
     ```
     https://pj10-syllabus-to-cal-3pm.vercel.app/api/auth/callback
     ```
   - **You can add both!** Just click "Add URI" for each one.

6. Click "Create"
7. Copy your **Client ID** and **Client Secret**

## Step 2: Set Up Environment Variables

### For Local Development:

1. Navigate to the frontend directory:
   ```bash
   cd syllabi-app/frontend
   ```

2. Copy the example file:
   ```bash
   cp .env.local.EXAMPLE .env.local
   ```

3. Edit `.env.local` and add your credentials:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

4. **Verify the file exists:**
   ```bash
   ls -la .env.local
   cat .env.local
   ```

### For Production (Vercel):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `pj10-syllabus-to-cal-3pm`
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret
   - `GOOGLE_REDIRECT_URI` = `https://pj10-syllabus-to-cal-3pm.vercel.app/api/auth/callback`
5. Make sure they're set for **All Environments** (Production, Preview, Development)

## Step 3: Common Issues & Fixes

### Error: "Missing required parameter: client_id"

**Cause:** Environment variables not loaded

**Fix:**
- Make sure `.env.local` exists in `syllabi-app/frontend/` (not in root!)
- Restart your dev server: `npm run dev`
- Check that the file has the correct values: `cat .env.local`

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI in Google Cloud Console doesn't match the one in your code

**Fix:**
- Check your `.env.local` has: `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback`
- In Google Cloud Console, make sure you added: `http://localhost:3000/api/auth/callback` to "Authorized redirect URIs"
- **Wait 5-10 minutes** after updating Google Cloud Console (changes can take time to propagate)

### Error: "Access blocked" or "invalid_client"

**Cause:** Client ID or Secret is wrong

**Fix:**
- Double-check you copied the full Client ID and Secret (no extra spaces)
- Make sure you're using the correct credentials for the right project

### Testing on Vercel but getting errors

**Cause:** Missing environment variables or wrong redirect URI

**Fix:**
- Add environment variables in Vercel (see Step 2 above)
- Make sure the production redirect URI is added to Google Cloud Console
- Redeploy after adding environment variables

## Step 4: Test It

1. Start the dev server:
   ```bash
   cd syllabi-app/frontend
   npm run dev
   ```

2. Go to: `http://localhost:3000/has_navbar/upload`

3. Click "Load sample events"

4. Click "Connect & Add to Google Calendar"

5. You should be redirected to Google to authorize

6. After authorizing, events should be added to your calendar!

## Sharing Credentials (Optional)

If you want to share credentials with the team:

1. Share the Client ID and Secret securely (e.g., Discord DM, password manager)
2. Everyone uses the same credentials in their `.env.local`
3. Make sure everyone adds the same redirect URIs to Google Cloud Console

**Note:** The Client ID is not sensitive, but the Client Secret should be kept private.

## Need Help?

- Check the browser console (F12) for errors
- Check the terminal where `npm run dev` is running for server errors
- Verify your `.env.local` file exists and has the right values
- Make sure you're running from `syllabi-app/frontend/` directory
