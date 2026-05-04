# Authentication System

Lumina Stories now includes a basic authentication system with user registration and login.

## Features

- **User Registration** - Create a new account with username and password
- **User Login** - Sign in with your credentials
- **Token-based Authentication** - Uses JWT (JSON Web Tokens) for secure API access
- **Protected Routes** - API endpoints require authentication
- **Session Persistence** - Authentication state persists across page refreshes

## Setup

### 1. Dependencies

The required packages have already been installed:
- `bcryptjs` - For secure password hashing
- `jsonwebtoken` - For JWT token generation and verification
- `dotenv` - For environment variable management

### 2. Environment Configuration

Edit your `.env` file and set the JWT secret:

```env
# Authentication Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production

# Backend API Server URL
API_SERVER_URL=http://localhost:3001
```

**IMPORTANT**: For production, generate a strong random secret:
```bash
openssl rand -base64 32
```

### 3. Starting the App

```bash
# Start both server and frontend
npm run dev:all

# Or in separate terminals:
# Terminal 1: Start the API server
npm run server

# Terminal 2: Start the frontend
npm run dev
```

## How It Works

### Frontend Flow

1. User lands on the app - sees **Login** page
2. User can:
   - Sign in with existing account
   - Create a new account via **Register** page
3. Upon successful authentication:
   - JWT token is stored in `localStorage`
   - User info is stored in `localStorage`
   - User is redirected to the main app
4. On subsequent visits:
   - App checks for stored token
   - If token exists, user is automatically logged in
   - If no token, user sees login page

### Backend Flow

1. **Registration** (`POST /api/auth/register`)
   - Creates new user in `users.json`
   - Hashes password with bcrypt
   - Returns JWT token

2. **Login** (`POST /api/auth/login`)
   - Verifies username and password
   - Returns JWT token if credentials are valid

3. **Protected Endpoints**
   - All API endpoints require `Authorization: Bearer {token}` header
   - Token is verified before processing request

## File Structure

### New Files Created

- `components/Login.tsx` - Login form component
- `components/Register.tsx` - Registration form component
- `components/AuthContext.tsx` - React Context for auth state management
- `utils/authService.ts` - Authentication API calls and token management
- `AUTHENTICATION.md` - This file

### Modified Files

- `server.js` - Added auth endpoints and middleware
- `App.tsx` - Added auth checks and components
- `index.tsx` - Wrapped app with AuthProvider
- `components/Layout.tsx` - Added logout button
- `.env.example` - Added JWT_SECRET configuration
- `vite.config.ts` - Added VITE_API_URL environment variable

## API Endpoints

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": "123", "username": "john_doe" }
}
```

### POST /api/auth/login
Login with existing credentials.

**Request:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": "123", "username": "john_doe" }
}
```

### GET /api/auth/verify
Verify authentication token.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "123", "username": "john_doe" }
}
```

## User Database

Users are stored in `users.json` with hashed passwords:

```json
{
  "john_doe": {
    "id": "1234567890",
    "username": "john_doe",
    "password": "$2a$10$..." // bcrypt hash
  }
}
```

## Requirements & Constraints

- Username must be at least 3 characters
- Password must be at least 6 characters
- Usernames must be unique
- Passwords are hashed with bcrypt (salted with 10 rounds)
- Tokens expire after 7 days

## Security Notes

⚠️ **For Production:**
1. Change `JWT_SECRET` to a strong, random value
2. Use HTTPS for all API calls
3. Implement rate limiting on auth endpoints
4. Consider adding email verification
5. Implement password reset functionality
6. Store users in a proper database (not JSON file)
7. Add CSRF protection
