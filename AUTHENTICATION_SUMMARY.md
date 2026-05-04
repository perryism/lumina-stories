# Authentication System - Quick Setup Guide

## What Was Added

✅ **User Registration & Login** - Users can create accounts and sign in  
✅ **JWT Token Authentication** - Secure token-based API authentication  
✅ **Protected Endpoints** - All API endpoints now require authentication  
✅ **Persistent Sessions** - Authentication state survives page refresh  
✅ **User Context** - Global auth state accessible via `useAuth()` hook  

## Quick Start

### 1. Install Dependencies
Already installed! (bcryptjs, jsonwebtoken, dotenv)

### 2. Configure Environment

Edit `.env`:
```env
JWT_SECRET=your-secret-key-change-this-in-production
API_SERVER_URL=http://localhost:3001
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Start the App

```bash
# Start both server and frontend
npm run dev:all

# Or separately:
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

### 4. Test Authentication

1. Open `http://localhost:3000`
2. Create a new account (Register tab)
3. Log in with credentials
4. You'll see the main app with username in header + Logout button

## Architecture

```
Frontend (React)
├── Login Component - Sign in form
├── Register Component - Create account form
├── AuthContext - Global auth state
└── authService.ts - API calls & token management
      ↓ (HTTP requests with JWT tokens)
Backend (Express.js)
├── POST /api/auth/register - Create user
├── POST /api/auth/login - Sign in
├── GET /api/auth/verify - Verify token
└── Protected Endpoints - Require auth token
      ↓ (Validates JWT)
User Database (users.json)
└── Stores username + hashed password
```

## Files Created

- `components/Login.tsx`
- `components/Register.tsx`
- `components/AuthContext.tsx`
- `utils/authService.ts`
- `AUTHENTICATION.md`

## Files Modified

- `server.js` - Added auth endpoints
- `App.tsx` - Added auth checks
- `index.tsx` - Wrapped with AuthProvider
- `components/Layout.tsx` - Added logout button
- `.env.example` - Added JWT_SECRET
- `vite.config.ts` - Added VITE_API_URL

## Using Authentication in Code

### Get current user
```tsx
import { useAuth } from './components/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <div>
      {user && <p>Hello, {user.username}!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected API calls
```tsx
const token = getToken();
const response = await fetch('/api/list-stories', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with 7-day expiration
- ✅ Tokens stored securely in localStorage
- ✅ Protected API endpoints require auth
- ⚠️ TODO: Use HTTPS in production
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Use database instead of JSON file
- ⚠️ TODO: Add email verification
- ⚠️ TODO: Implement password reset

## Testing

Test the auth system:

1. **Register** - Create account with username + password
2. **Login** - Sign in with credentials
3. **Persistence** - Refresh page, should stay logged in
4. **Logout** - Click Logout button, should return to login
5. **Protected Routes** - Try accessing API without token (should fail)

## Next Steps

1. Change `JWT_SECRET` to a secure value
2. Test with your own username/password
3. See `AUTHENTICATION.md` for detailed documentation
4. For production: implement database, HTTPS, email verification, etc.
