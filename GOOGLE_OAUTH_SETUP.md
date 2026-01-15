# Google OAuth Setup Guide

## Error: Missing required parameter: client_id

This error occurs because Google OAuth credentials are not configured. Follow these steps to set it up:

---

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console:**

   - Visit: https://console.cloud.google.com/

2. **Create a New Project (or select existing):**

   - Click "Select a project" → "New Project"
   - Name it (e.g., "Hotel Management")
   - Click "Create"

3. **Enable Google+ API:**

   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**

   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (for testing) or Internal
     - App name: hotel-management
     - User support email: your email
     - Developer contact: your email
     - Click "Save and Continue"
     - Scopes: Add `email` and `profile`
     - Test users: Add your email (for testing)
     - Click "Save and Continue" → "Back to Dashboard"

5. **Create OAuth Client:**

   - Application type: **Web application**
   - Name: Hotel Management Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for frontend)
     - `http://localhost:3000` (for backend callback)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:3001` (if using frontend redirect)
   - Click "Create"

6. **Copy Credentials:**
   - You'll see a popup with:
     - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc123...`)
   - **Save these!** You won't see the secret again

---

## Step 2: Configure Environment Variables

### Option A: Local Development (.env file)

Create or update `server/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Option B: Docker

**For docker-compose.yml (Production):**

```bash
# Set environment variables before running
export GOOGLE_CLIENT_ID=your-client-id-here
export GOOGLE_CLIENT_SECRET=your-client-secret-here
export GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Then run
docker-compose up -d
```

**Or create a `.env` file in the project root:**

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Docker Compose will automatically read `.env` file.

### Option C: Update docker-compose.yml directly

Edit `docker-compose.yml` or `docker-compose.dev.yml`:

```yaml
environment:
  GOOGLE_CLIENT_ID: "your-client-id-here.apps.googleusercontent.com"
  GOOGLE_CLIENT_SECRET: "your-client-secret-here"
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback"
```

---

## Step 3: Configure Frontend

Update `client/.env` or create it:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Important:** Frontend uses `REACT_APP_` prefix for environment variables.

---

## Step 4: Restart Services

### Local Development:

```bash
# Stop server (Ctrl+C)
# Restart
cd server
npm run dev
```

### Docker:

```bash
docker-compose down
docker-compose up -d
```

---

## Step 5: Test Google Login

1. Go to: http://localhost:3001/login
2. Click "Sign in with Google"
3. Select your Google account
4. Should redirect back and log you in

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution:**

- Check that the redirect URI in Google Console matches exactly:
  - `http://localhost:3000/api/auth/google/callback`
- Make sure there are no trailing slashes
- Wait a few minutes after updating (Google caches settings)

### Error: "invalid_client"

**Solution:**

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check for extra spaces or quotes in environment variables
- Restart the server after changing environment variables

### Error: "access_denied"

**Solution:**

- Make sure your email is added as a test user in OAuth consent screen
- For production, you need to verify the app with Google

### Google OAuth Not Working in Docker

**Solution:**

- Make sure environment variables are passed to Docker
- Check Docker logs: `docker logs hotel-server`
- Verify the redirect URI uses the correct port (3000 for Docker)

---

## Security Notes

⚠️ **Never commit credentials to Git!**

- Add `.env` to `.gitignore` (already done)
- Use environment variables or secrets management in production
- Rotate credentials if accidentally exposed

---

## Quick Reference

**Backend Environment Variables:**

- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI` - Callback URL (usually `http://localhost:3000/api/auth/google/callback`)

**Frontend Environment Variables:**

- `REACT_APP_GOOGLE_CLIENT_ID` - Same Client ID as backend

**Google Console Settings:**

- Authorized JavaScript origins: `http://localhost:3001`
- Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

---

## Alternative: Disable Google OAuth

If you don't want to use Google OAuth, the system will work fine without it. The error will only appear when users try to click "Sign in with Google". Regular username/password login will work normally.

The server now handles missing Google credentials gracefully and returns a proper error message instead of crashing.
