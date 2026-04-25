# Namaste Stay - Backend Server

Express.js backend for the Namaste Stay hotel booking application with MERN stack integration.

## Features

- ✅ **Email Registration** with verification codes
- ✅ **Email/Password Authentication** with JWT tokens
- ✅ **Google OAuth 2.0** integration
- ✅ **Automatic Gmail Profile Picture Fetching** via Google API
- ✅ **MongoDB** persistent storage
- ✅ **Password Hashing** with bcryptjs
- ✅ **JWT Token Management** for sessions
- ✅ **CORS** enabled for frontend communication
- ✅ **Email Verification** system

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/namaste-stay
JWT_SECRET=your_secure_random_secret
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM_NAME=Namaste Stay
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Run Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection setup
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   └── User.js              # MongoDB User schema
├── routes/
│   └── auth.js              # Authentication API endpoints
├── utils/
│   ├── tokenUtils.js        # JWT helper functions
│   └── googleUtils.js       # Google API integration
├── server.js                # Express app setup
├── package.json
└── .env                     # Environment variables (not in git)
```

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: { name, email, password, accountType }
Response: { success, email, verificationCode, expiresAt }
```

#### Verify Email
```
POST /api/auth/verify-email
Body: { email, verificationCode }
Response: { success, token, user }
```

#### Resend Verification Code
```
POST /api/auth/resend-verification
Body: { email }
Response: { success, email, expiresAt }
```

#### Login
```
POST /api/auth/login
Body: { email, password, accountType }
Response: { success, token, user }
```

#### Google OAuth
```
POST /api/auth/google-oauth
Body: { googleId, name, email, accessToken, accountType }
Response: { success, token, user { profilePicture, ... } }
```
⭐ **This automatically fetches profile picture from Google!**

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, user }
```

#### Update Profile Picture
```
PUT /api/auth/profile-picture
Headers: Authorization: Bearer <token>
Body: { profilePicture: "https://..." }
Response: { success, profilePicture }
```

#### Refresh Profile Picture from Google
```
POST /api/auth/refresh-profile-picture
Headers: Authorization: Bearer <token>
Response: { success, profilePicture }
```

## Database Schema

```javascript
User {
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  profilePicture: String (URL),     // ⭐ Gmail profile pic stored here
  googleId: String,
  googleAccessToken: String,
  emailVerified: Boolean,
  emailVerificationCode: String,
  emailVerificationExpiresAt: Date,
  accountType: String (user|owner),
  authProvider: String (email|google),
  createdAt: Date,
  updatedAt: Date
}
```

## How Gmail Profile Picture Works

### Flow:
1. User logs in with Google
2. Frontend sends OAuth access token to backend
3. Backend calls Google API: `https://www.googleapis.com/oauth2/v2/userinfo`
4. Google returns profile picture URL
5. Backend stores URL in MongoDB
6. Frontend displays the picture

### Key Files:
- `utils/googleUtils.js` - Fetches from Google
- `routes/auth.js` - POST /google-oauth endpoint
- `models/User.js` - Stores profilePicture field

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/namaste-stay` |
| `JWT_SECRET` | Secret for JWT signing | `your_secret_key_123` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `xxx` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Technologies Used

- **Express.js** - Web framework
- **Node.js** - JavaScript runtime
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **axios** - HTTP client
- **cors** - Cross-origin requests
- **dotenv** - Environment variables

## Development

### Install Nodemon (auto-reload)
```bash
npm install -D nodemon
```

### Run in Watch Mode
```bash
npm run dev
```

## Testing with Postman

1. **Register:**
   - POST http://localhost:5000/api/auth/register
   - Body: `{ "name": "John", "email": "john@test.com", "password": "123" }`

2. **Verify Email:**
   - POST http://localhost:5000/api/auth/verify-email
   - Body: `{ "email": "john@test.com", "verificationCode": "123456" }`
   - Save the returned token

3. **Get Profile:**
   - GET http://localhost:5000/api/auth/me
   - Header: `Authorization: Bearer <token>`

## Production Deployment

### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=mongodb+srv://...
```

### Railway
```bash
npm i -g @railway/cli
railway init
railway up
```

### Environment Variables
- Use cloud provider's secrets management
- Never commit `.env` file
- See `.env.example` for required variables

## Troubleshooting

### Email Verification Not Sending
- Make sure `EMAIL_USER` and `EMAIL_PASS` are set in `backend/.env`
- For Gmail, use a Google App Password instead of your normal account password
- Confirm 2-Step Verification is enabled on the Gmail account
- Check that `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` match Gmail settings

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`

### Google OAuth Error
- Verify Google Client ID and Secret in `.env`
- Check redirect URIs in Google Cloud Console
- Ensure People API is enabled

### CORS Error
- Verify `FRONTEND_URL` in `.env`
- Check frontend is making requests to `http://localhost:5000/api`

### Profile Picture Not Showing
- Check `User.profilePicture` field in MongoDB
- Verify Google access token is valid
- Check browser console for image loading errors

## Documentation

See parent directory:
- `QUICK_START.md` - 5-minute setup guide
- `MERN_GMAIL_SETUP.md` - Complete setup instructions
- `TECHNICAL_DEEP_DIVE.md` - Architecture and flow diagrams

## License

ISC

## Support

For issues or questions, check the main documentation files or test endpoints with Postman.
