import express from 'express';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/paymentModel.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { generateToken } from '../utils/tokenUtils.js';
import bcryptjs from 'bcryptjs';

const router = express.Router();

/**
 * POST /api/admin/login
 * Dedicated admin login endpoint
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      $or: [{ accountType: 'admin' }, { role: 'admin' }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: 'admin',
        role: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin login error', error: error.message });
  }
});

/**
 * GET /api/admin/dashboard
 * Dashboard summary statistics
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalHotels,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      awaitingPaymentBookings,
      allBookings,
      recentBookings,
      totalTransactions,
    ] = await Promise.all([
      User.countDocuments({ accountType: { $ne: 'admin' } }),
      Hotel.countDocuments(),
      // Total bookings = confirmed + awaiting payment (all real user bookings)
      Booking.countDocuments({ status: { $in: ['confirmed', 'awaiting_payment'] } }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'awaiting_payment' }),
      Booking.find({ paymentStatus: 'completed' }).select('totalPrice createdAt'),
      // Recent bookings: only show confirmed bookings
      Booking.find({ status: 'confirmed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email')
        .populate('hotel', 'name'),
      Transaction.countDocuments({ status: 'COMPLETED' }),
    ]);

    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Monthly revenue data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthBookings = allBookings.filter(b => {
        const d = new Date(b.createdAt);
        return d >= startOfMonth && d <= endOfMonth;
      });

      monthlyData.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((s, b) => s + (b.totalPrice || 0), 0),
      });
    }

    // Booking status distribution for donut chart
    const statusDistribution = {
      confirmed: confirmedBookings,
      awaiting_payment: awaitingPaymentBookings,
      cancelled: cancelledBookings,
      failed: await Booking.countDocuments({ status: 'failed' }),
    };

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalHotels,
        totalBookings,      // confirmed bookings only
        confirmedBookings,
        awaitingPaymentBookings,
        cancelledBookings,
        totalRevenue,
        totalTransactions,
      },
      monthlyData,
      statusDistribution,
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
});

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, totalCount] = await Promise.all([
      User.find({ accountType: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('name email accountType isActive createdAt emailVerified'),
      User.countDocuments({ accountType: { $ne: 'admin' } }),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/toggle
 * Toggle user active status
 */
router.put('/users/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountType === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user', error: error.message });
  }
});

/**
 * PUT /api/admin/change-password
 * Change admin password
 */
router.put('/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const admin = await User.findById(req.user._id).select('+password');

    const isValid = await admin.matchPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

export default router;
