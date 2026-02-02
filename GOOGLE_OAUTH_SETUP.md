# Google OAuth Setup Guide

## Overview
This document explains how to properly set up and configure Google OAuth (Sign-in/Sign-up) for CodeRank.

---

## **Step 1: Create Google OAuth Credentials**

### Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API**

### Create OAuth 2.0 Credentials
1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Choose **Web application**
3. Add Authorized redirect URIs:
   - **Local Development**: `http://localhost:4200`
   - **Production**: `https://code-rank.vercel.app`

4. Add Authorized JavaScript origins:
   - **Local Development**: `http://localhost:4200`
   - **Production**: `https://code-rank.vercel.app`

5. Copy your **Client ID** (you'll need it for frontend)

---

## **Step 2: Frontend Configuration**

### Update Environment Files

**`frontend/src/environments/environment.ts` (Development)**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Replace with your Client ID
};
```

**`frontend/src/environments/environment.prod.ts` (Production)**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://coderank-mdwd.onrender.com/api/v1',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Same Client ID
};
```

### Verify HTML Script Tag
`frontend/src/index.html` should have:
```html
<!-- Google Sign-In Script -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

---

## **Step 3: Backend Configuration**

### Create `.env` file in project root
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/coderank

# JWT
JWT_SECRET=your-secure-jwt-secret-key

# CORS
CORS_ORIGIN=https://code-rank.vercel.app  # Production frontend URL

# Environment
NODE_ENV=development
```

### Verify Installed Packages
```bash
npm install google-auth-library
```

---

## **Step 4: How Google OAuth Flow Works**

### Frontend Flow
```
User clicks "Sign in with Google"
    ↓
Google Sign-In popup appears
    ↓
User authenticates with Google
    ↓
Google returns JWT credential (ID Token)
    ↓
Frontend sends credential to Backend (/api/v1/auth/google)
    ↓
Backend verifies credential
    ↓
Backend creates/updates user in MongoDB
    ↓
Backend returns session token + user data
    ↓
Frontend stores token in cookies + localStorage
    ↓
Frontend navigates to dashboard
```

### Backend Verification
1. **Receives** Google ID Token from frontend
2. **Validates** token signature using Google's public keys
3. **Extracts** user info (email, name, picture)
4. **Finds or Creates** user in MongoDB
5. **Generates** JWT token for session
6. **Returns** user data + token

---

## **Step 5: File Structure & Key Files**

```
backend/
├── config/config.js                    ← Google config loaded here
├── src/
│   └── auth-service/
│       ├── auth.service.js             ← googleAuth() method
│       ├── auth.controller.js           ← /google endpoint
│       └── auth.routes.js               ← Route definition

frontend/
├── src/
│   ├── environments/
│   │   ├── environment.ts              ← Dev config
│   │   └── environment.prod.ts         ← Prod config
│   └── app/features/auth/
│       ├── login/login.component.ts    ← Login with Google
│       └── register/register.component.ts ← Sign-up with Google
```

---

## **Step 6: Testing Locally**

### Prerequisites
```bash
# Start backend
cd backend
npm install
npm run dev

# Start frontend (in another terminal)
cd frontend
ng serve
```

### Test Steps
1. Open `http://localhost:4200`
2. Go to **Register** or **Login** page
3. Click **"Sign in with Google"** button
4. Complete Google authentication
5. Should redirect to dashboard on success

### Check Console for Errors
- Browser Console (F12) for frontend errors
- Backend logs for API errors
- Network tab (F12) to see `/api/v1/auth/google` request/response

---

## **Step 7: Troubleshooting**

### Problem: "Google library failed to load"
**Solution**: 
- Check internet connection
- Verify `<script src="https://accounts.google.com/gsi/client">` in HTML
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Problem: "client_id is invalid"
**Solution**:
- Verify Client ID matches between Google Cloud Console and environment files
- Ensure you're using the **Client ID** not **Client Secret**

### Problem: "Token verification failed"
**Solution**:
- Check `GOOGLE_CLIENT_ID` in `.env` file
- Verify `GOOGLE_CLIENT_ID` in frontend environment files match
- Clear browser cookies and try again

### Problem: "Invalid redirect_uri"
**Solution**:
- Add redirect URIs to Google Cloud Console Credentials
- URLs must match exactly (protocol, domain, port)

### Problem: "User already exists" (Sign-up)
**Solution**:
- This is normal if email already in database
- User can use Sign-in instead
- Or user can login with Google using same email

---

## **Step 8: Environment Variables Summary**

### Backend (.env file)
```
GOOGLE_CLIENT_ID=      ← From Google Cloud Console
GOOGLE_CLIENT_SECRET=  ← From Google Cloud Console (for server-side apps only)
JWT_SECRET=            ← Any secure string
MONGODB_URI=           ← MongoDB connection string
NODE_ENV=              ← 'development' or 'production'
CORS_ORIGIN=           ← Frontend URL for CORS
```

### Frontend (environment files)
```
apiUrl=                ← Backend API URL
googleClientId=        ← From Google Cloud Console (same as backend)
```

---

## **Step 9: Production Deployment**

### Render Backend
1. Add environment variables in Render dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` (optional, not needed for frontend-only verification)
   - `JWT_SECRET`
   - `MONGODB_URI`
   - `CORS_ORIGIN=https://code-rank.vercel.app`

2. Update Google Cloud Console Credentials:
   - Add `https://code-rank.vercel.app` to authorized JavaScript origins
   - Add `https://coderank-mdwd.onrender.com/api/v1/auth/google` to authorized redirect URIs

### Vercel Frontend
1. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (if using Next.js) or update environment files

---

## **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Button not appearing | Google library not loaded | Wait 5s, check network, hard refresh |
| Token verification failed | Wrong Client ID | Verify Client ID in all config files |
| User not created | Username duplicate | User already exists, use Sign-in |
| CORS error | Frontend URL not authorized | Add URL to Google Cloud Console |
| Redirect fails | Navigation error | Check auth guard implementation |

---

## **Security Best Practices**

✅ **DO:**
- Use Client ID only on frontend
- Keep Client Secret on backend only
- Use HTTPS in production
- Validate tokens on backend
- Set secure JWT secrets
- Use appropriate token expiry times

❌ **DON'T:**
- Expose Client Secret in frontend code
- Use weak JWT secrets
- Skip token verification
- Allow arbitrary domains in CORS
- Store sensitive data in localStorage

---

## **Useful Links**

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [Testing OAuth Flows](https://developers.google.com/identity/gsi/web/guides/test)

---

## **Support**

For additional issues:
1. Check browser console (F12)
2. Check backend logs
3. Verify all environment variables
4. Test with incognito/private window
5. Clear cookies and localStorage
