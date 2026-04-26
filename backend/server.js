import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'node:process';
import { connectDB } from './config/database.js';
import Booking from './models/Booking.js';
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/admin.js';
import { seedAdminAccount } from './utils/seedAdmin.js';

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// Connect to MongoDB and seed admin
const initDB = async () => {
  await connectDB();
  await seedAdminAccount();
};
initDB();

const cleanupExpiredBookings = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // Find bookings that have been pending for over an hour
    const expiredBookings = await Booking.find({
      status: 'awaiting_payment',
      createdAt: { $lt: oneHourAgo }
    });

    if (expiredBookings.length > 0) {
      const bookingIds = expiredBookings.map(b => b._id);
      
      // Delete the bookings
      const bResult = await Booking.deleteMany({ _id: { $in: bookingIds } });
      // Delete the corresponding transactions
      const tResult = await (await import('./models/paymentModel.js')).default.deleteMany({ booking: { $in: bookingIds } });
      
      console.log(`[Cleanup] Deleted ${bResult.deletedCount} expired unpaid bookings and ${tResult.deletedCount} transactions`);
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired bookings:', error.message);
  }
};

// Run cleanup on startup and every hour
cleanupExpiredBookings();
setInterval(cleanupExpiredBookings, 60 * 60 * 1000);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Start server with automatic fallback if a port is busy.
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying port ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error('Server startup error:', error);
    process.exit(1);
  });
};

startServer(DEFAULT_PORT);
