import express from 'express';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { generateToken, generateVerificationCode } from '../utils/tokenUtils.js';
import { getGoogleProfilePicture } from '../utils/googleUtils.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail } from '../utils/emailUtils.js';

const router = express.Router();

const VERIFICATION_CODE_TTL_MINUTES = 15;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOW_OTP_FALLBACK = String(process.env.ALLOW_OTP_FALLBACK || (!IS_PRODUCTION)).toLowerCase() === 'true';

// Register with Email
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, accountType = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (!existingUser.emailVerified && existingUser.authProvider === 'email') {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

    // Save signup details in temporary storage until OTP is verified.
    let pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pendingRegistration) {
      pendingRegistration = new PendingRegistration({
        name,
        email: normalizedEmail,
        password,
        accountType,
        verificationCode,
        verificationExpiresAt,
      });
    } else {
      pendingRegistration.name = name;
      pendingRegistration.password = password;
      pendingRegistration.accountType = accountType;
      pendingRegistration.verificationCode = verificationCode;
      pendingRegistration.verificationExpiresAt = verificationExpiresAt;
      pendingRegistration.createdAt = new Date();
    }

    await pendingRegistration.save();

    try {
      await sendVerificationEmail({
        to: pendingRegistration.email,
        name: pendingRegistration.name,
        verificationCode,
        expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
      });
    } catch (emailError) {
      console.error('Verification email send failed during registration:', emailError);

      if (!ALLOW_OTP_FALLBACK) {
        await PendingRegistration.deleteOne({ _id: pendingRegistration._id });
        return res.status(500).json({
          success: false,
          message: 'Unable to send verification email. Account was not created.',
          error: emailError.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration saved, but email delivery failed. Use the fallback OTP for development testing.',
        email: pendingRegistration.email,
        expiresAt: verificationExpiresAt,
        ...(IS_PRODUCTION ? {} : { fallbackOtp: verificationCode }),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent to your Gmail inbox.',
      email: pendingRegistration.email,
      expiresAt: verificationExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration error', error: error.message });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ message: 'Email and verification code required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail })
      .select('+password +verificationCode +verificationExpiresAt');

    if (!pendingRegistration) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser?.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified. Please sign in.' });
      }
      return res.status(404).json({ message: 'No pending verification found for this email' });
    }

    if (Date.now() > pendingRegistration.verificationExpiresAt) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (pendingRegistration.verificationCode !== verificationCode.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pendingRegistration._id });
      return res.status(400).json({ message: 'Email already registered. Please sign in.' });
    }

    // Create the actual user only after successful OTP verification.
    const user = new User({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      accountType: pendingRegistration.accountType,
      emailVerified: true,
      authProvider: 'email',
    });

    await user.save();
    await PendingRegistration.deleteOne({ _id: pendingRegistration._id });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
});

// Resend Verification Code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pendingRegistration) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser?.emailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }
      return res.status(404).json({ message: 'No pending verification found for this email' });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

    pendingRegistration.verificationCode = verificationCode;
    pendingRegistration.verificationExpiresAt = verificationExpiresAt;
    pendingRegistration.createdAt = new Date();
    await pendingRegistration.save();

    try {
      await sendVerificationEmail({
        to: pendingRegistration.email,
        name: pendingRegistration.name,
        verificationCode,
        expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
      });
    } catch (emailError) {
      console.error('Verification email resend failed:', emailError);

      if (!ALLOW_OTP_FALLBACK) {
        return res.status(500).json({
          success: false,
          message: 'Unable to resend verification email. Please try again later.',
          error: emailError.message,
        });
      }

      return res.json({
        success: true,
        message: 'OTP regenerated, but email delivery failed. Use fallback OTP for development testing.',
        email: pendingRegistration.email,
        expiresAt: verificationExpiresAt,
        ...(IS_PRODUCTION ? {} : { fallbackOtp: verificationCode }),
      });
    }

    res.json({
      success: true,
      message: 'Verification code resent to your email',
      email: pendingRegistration.email,
      expiresAt: verificationExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resending code', error: error.message });
  }
});

// Login with Email and Password
router.post('/login', async (req, res) => {
  try {
    const { email, password, accountType = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      accountType,
    }).select('+password');

    if (!user) {
      const pendingRegistration = await PendingRegistration.findOne({
        email: normalizedEmail,
        accountType,
      });

      if (pendingRegistration) {
        return res.status(403).json({
          message: 'Please verify your email before signing in',
          email: pendingRegistration.email,
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in',
        email: user.email,
      });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Google OAuth Callback
// This endpoint receives the OAuth token from frontend and completes the login/registration
router.post('/google-oauth', async (req, res) => {
  try {
    const {
      googleId,
      name,
      email,
      accessToken,
      profilePicture: providedProfilePicture,
      accountType = 'user',
    } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Missing OAuth data' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If this email has an OTP-pending registration, prevent bypassing OTP through social login.
    const pendingRegistration = await PendingRegistration.findOne({ email: normalizedEmail });
    if (pendingRegistration) {
      return res.status(403).json({
        success: false,
        message: 'This email has a pending OTP verification. Complete OTP verification before signing in.',
      });
    }

    let profilePicture = providedProfilePicture || null;

    if (!profilePicture && accessToken) {
      profilePicture = await getGoogleProfilePicture(accessToken);
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      // Update existing user with Google profile picture
      user.googleId = googleId;
      user.profilePicture = profilePicture || user.profilePicture;
      if (accessToken) {
        user.googleAccessToken = accessToken;
      }
      user.emailVerified = true;
      user.authProvider = 'google';
    } else {
      // Create new user from Google OAuth
      user = new User({
        googleId,
        name,
        email: normalizedEmail,
        profilePicture,
        accountType,
        emailVerified: true,
        authProvider: 'google',
        googleAccessToken: accessToken || undefined,
      });
    }

    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google OAuth successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Google OAuth error', error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        accountType: req.user.accountType,
        emailVerified: req.user.emailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update profile picture (manual upload or refresh from Google)
router.put('/profile-picture', authenticateToken, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: 'Profile picture URL required' });
    }

    req.user.profilePicture = profilePicture;
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile picture updated',
      profilePicture: req.user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile picture', error: error.message });
  }
});

// Refresh profile picture from Google (for Google OAuth users)
router.post('/refresh-profile-picture', authenticateToken, async (req, res) => {
  try {
    if (!req.user.googleAccessToken) {
      return res.status(400).json({
        message: 'This account is not linked to Google',
      });
    }

    const profilePicture = await getGoogleProfilePicture(req.user.googleAccessToken);

    if (profilePicture) {
      req.user.profilePicture = profilePicture;
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Profile picture refreshed',
      profilePicture: req.user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error refreshing profile picture', error: error.message });
  }
});

export default router;
