# Gmail Profile Picture Integration - MERN Implementation Guide

This guide explains how to set up and implement automatic Gmail profile picture fetching in your Namaste Stay application using the MERN stack.

## Architecture Overview

```
┌─────────────────┐
│   React Frontend│
│   (Vite)        │
└────────┬────────┘
         │
    HTTP API
         │
┌────────▼────────────────┐
│  Express Backend        │
│  (Node.js)              │
└────────┬────────────────┘
         │
    ┌────┴─────────┐
    │              │
┌───▼────┐    ┌───▼───────┐
│MongoDB  │    │Google API │
│         │    │           │
└─────────┘    └───────────┘
```

## How It Works

### 1. **Email Registration Flow**
```
User enters: name, email, password
    ↓
Backend validates & creates unverified user in MongoDB
    ↓
Verification code sent (setup email service)
    ↓
User verifies email
    ↓
Account activated, user can login
```

### 2. **Google OAuth Flow (with Profile Picture)**
```
User clicks "Login with Google"
    ↓
Google OAuth dialog opens
    ↓
Backend receives OAuth code & access token
    ↓
Backend calls Google People API with access token
    ↓
Fetches user's profile picture URL
    ↓
Creates/updates user in MongoDB with profile picture
    ↓
Returns JWT token + user data to frontend
    ↓
Frontend displays profile picture
```

## Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

Dependencies installed:
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT tokens
- **google-auth-library**: Google OAuth
- **axios**: HTTP client (for Google API calls)
- **cors**: Cross-origin requests
- **dotenv**: Environment variables

### Step 2: Configure Environment Variables

Create a `.env` file in the backend folder:

```env
# MongoDB - Use local or cloud database
MONGODB_URI=mongodb://localhost:27017/namaste-stay
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/namaste-stay

# JWT Secret - Generate a strong random string
JWT_SECRET=your_very_secure_random_jwt_secret_key_here

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 3: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - **Google+ API** (for authentication)
   - **Google People API** (for profile details)
   - **Gmail API** (optional, for email sending)
4. Create OAuth 2.0 credentials:
   - Type: Web Application
   - Authorized origins: `http://localhost:5173`, `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`
5. Copy **Client ID** and **Client Secret** to `.env`

### Step 4: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Then run MongoDB server
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/namaste-stay`
4. Add to `.env`

### Step 5: Start the Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:5000`

### Step 6: Update Frontend Configuration

Create or update `.env` in the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 7: Update Google OAuth in Frontend

Install Google OAuth library:

```bash
npm install @react-oauth/google
```

Update `main.jsx`:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
```

Update Login.jsx to use real Google OAuth (instead of mock):

```jsx
import { useGoogleLogin } from '@react-oauth/google';

// In your login component:
const login = useGoogleLogin({
  onSuccess: async (codeResponse) => {
    // Send to backend
    const result = await loginWithGoogle({
      googleId: codeResponse.sub,
      name: codeResponse.name,
      email: codeResponse.email,
      accessToken: codeResponse.access_token,
    }, userType || 'user');
  },
  flow: 'implicit', // or 'auth-code'
});
```

### Step 8: Handle Email Verification in Backend

For production, set up email sending:

```bash
npm install nodemailer
```

Update `backend/routes/auth.js` to send emails instead of returning codes.

## API Endpoints

### Authentication Endpoints

#### 1. Register with Email
```
POST /api/auth/register
Body: { name, email, password, accountType }
Response: { success, email, verificationCode, expiresAt }
```

#### 2. Verify Email
```
POST /api/auth/verify-email
Body: { email, verificationCode }
Response: { success, token, user { id, name, email, profilePicture } }
```

#### 3. Login with Email/Password
```
POST /api/auth/login
Body: { email, password, accountType }
Response: { success, token, user { id, name, email, profilePicture } }
```

#### 4. Google OAuth Login
```
POST /api/auth/google-oauth
Body: { googleId, name, email, accessToken, accountType }
Response: { success, token, user { id, name, email, profilePicture } }
```
⭐ **This endpoint automatically fetches and stores the Google profile picture**

#### 5. Get Current User
```
GET /api/auth/me
Header: Authorization: Bearer <token>
Response: { success, user { ... } }
```

#### 6. Update Profile Picture (Manual)
```
PUT /api/auth/profile-picture
Header: Authorization: Bearer <token>
Body: { profilePicture: "https://..." }
Response: { success, profilePicture }
```

#### 7. Refresh Profile Picture from Google
```
POST /api/auth/refresh-profile-picture
Header: Authorization: Bearer <token>
Response: { success, profilePicture }
```

## How Profile Pictures Are Fetched

### For Google OAuth Users:
1. User logs in with Google
2. Backend receives access token
3. Backend calls Google OAuth API: `https://www.googleapis.com/oauth2/v2/userinfo`
4. Extracts `picture` field from response
5. Stores URL in MongoDB `User.profilePicture`
6. Returns URL to frontend

### For Email Users:
1. Can upload custom profile picture
2. Can optionally connect Google account later
3. Can refresh from Google if connected

## Frontend Usage

```jsx
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, updateProfilePicture, refreshProfilePictureFromGoogle } = useAuth();

  return (
    <div>
      {user?.profilePicture && (
        <img src={user.profilePicture} alt="Profile" className="w-16 h-16 rounded-full" />
      )}
      
      {/* Update with custom picture */}
      <button onClick={() => updateProfilePicture('https://new-picture-url.jpg')}>
        Change Picture
      </button>
      
      {/* Refresh from Google (if Google linked) */}
      <button onClick={() => refreshProfilePictureFromGoogle()}>
        Sync with Google
      </button>
    </div>
  );
}
```

## Security Best Practices

✅ **What's Implemented:**
- Password hashing with bcryptjs (10 rounds)
- JWT tokens for session management
- MongoDB schema validation
- Email verification
- CORS protection
- Environment variable isolation

🔧 **To Add in Production:**
- HTTPS/TLS encryption
- Email verification via actual email service
- Rate limiting
- Input sanitization
- Refresh token rotation
- Database backups

## Troubleshooting

### "Connection refused" error
- Check MongoDB is running: `mongod`
- Verify `MONGODB_URI` in `.env`

### "Invalid OAuth credentials"
- Check Google Client ID in `.env`
- Verify redirect URIs in Google Cloud Console

### "Profile picture not showing"
- Check browser console for CORS errors
- Verify Google OAuth access token is valid
- Check MongoDB `profilePicture` field is saved

### "Email verification code not received"
- Currently prints to console (for testing)
- In production, integrate email service (see Step 8)

## File Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js              # JWT authentication
├── models/
│   └── User.js              # MongoDB schema
├── routes/
│   └── auth.js              # Authentication endpoints
├── utils/
│   ├── tokenUtils.js        # JWT helper functions
│   └── googleUtils.js       # Google API integration
├── server.js                # Express server
├── package.json
└── .env                     # Environment variables

src/
├── services/
│   └── AuthAPI.js           # Frontend API calls
├── context/
│   └── AuthContext.jsx      # Auth state (updated for backend)
└── ...
```

## Next Steps

1. ✅ Backend setup complete
2. ✅ Database configured
3. 🔄 Integrate real Google OAuth in frontend
4. 🔄 Set up email verification service
5. 🔄 Test full flow end-to-end
6. 🔄 Deploy to production

## Production Deployment

### Backend (Heroku/Railway)
```bash
# Add to .env for production
NODE_ENV=production
MONGODB_URI=mongodb+srv://... (MongoDB Atlas)
JWT_SECRET=production_secret
FRONTEND_URL=https://yourdomain.com
```

### Frontend (Vercel/Netlify)
```bash
# .env.production
VITE_API_URL=https://your-api.com/api
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
```

---

**Questions?** Check the implementation in:
- Backend routes: `backend/routes/auth.js`
- Frontend service: `src/services/AuthAPI.js`
- Frontend context: `src/context/AuthContext.jsx`
