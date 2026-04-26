import express from 'express';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/bookings - Create a new booking (awaiting payment confirmation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      district,
      province,
      roomType,
      checkIn,
      checkOut,
      guests,
      pricePerNight,
      totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      image,
    } = req.body;

    // Validate required fields
    if (!hotelId || !hotelName || !roomType || !checkIn || !checkOut || !guests || !totalPrice) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    // Date validation
    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayDate();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkIn < todayStr) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }
    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Calculate nights
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    // Try to find hotel by ObjectId first, then by name
    let hotelObjectId = null;
    try {
      // Try parsing hotelId as a MongoDB ObjectId
      const mongoose = (await import('mongoose')).default;
      if (mongoose.Types.ObjectId.isValid(hotelId)) {
        const hotelDoc = await Hotel.findById(hotelId);
        if (hotelDoc) hotelObjectId = hotelDoc._id;
      }
      // Fallback: find by hotel name (case-insensitive)
      if (!hotelObjectId) {
        const hotelDoc = await Hotel.findOne({ name: { $regex: new RegExp(`^${hotelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (hotelDoc) hotelObjectId = hotelDoc._id;
      }
    } catch (err) {
      console.log('Hotel lookup failed:', err.message);
    }

    // Check for overlapping confirmed bookings for the same hotel + room type (across all users)
    const overlapping = await Booking.findOne({
      hotelName,
      roomType,
      status: 'confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (overlapping) {
      return res.status(409).json({
        message: `This room type is already booked from ${overlapping.checkIn.toISOString().split('T')[0]} to ${overlapping.checkOut.toISOString().split('T')[0]}. Please choose different dates or a different room type.`,
      });
    }

    const booking = new Booking({
      user: req.user._id,
      hotel: hotelObjectId,
      hotelName,
      district: district || '',
      province: province || '',
      roomType,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      nights,
      pricePerNight: Number(pricePerNight) || Math.round(Number(totalPrice) / nights),
      totalPrice: Number(totalPrice),
      status: 'awaiting_payment',
      paymentStatus: 'pending',
      paymentMethod: 'esewa',
      guestName: guestName || req.user.name,
      guestEmail: guestEmail || req.user.email,
      guestPhone: guestPhone || '',
      specialRequests: specialRequests || '',
      image: image || '',
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created (awaiting payment confirmation)',
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// GET /api/bookings - Get current user's bookings
// Only returns bookings that are CONFIRMED or CANCELLED — awaiting_payment/failed are hidden
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = { user: req.user._id };
    if (status) {
      // Allow explicit status filter (e.g. ?status=confirmed)
      filter.status = status;
    } else {
      // Default: only show bookings the user should see (paid or cancelled)
      filter.status = { $in: ['confirmed', 'cancelled', 'completed'] };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('hotel', 'name coverImage district'),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// GET /api/bookings/all - Get all bookings (admin only)
// Excludes awaiting_payment by default — admin sees only real (paid/cancelled) bookings
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus, includeAll } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else if (!includeAll) {
      // Default: hide pending payment bookings from admin list
      filter.status = { $nin: ['awaiting_payment', 'failed'] };
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email')
        .populate('hotel', 'name district'),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all bookings', error: error.message });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('hotel', 'name coverImage district province');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow own booking or admin
    const role = req.user.role || req.user.accountType;
    let isAuthorized = false;

    if (role === 'admin' || String(booking.user._id) === String(req.user._id)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const role = req.user.role || req.user.accountType;
    let isAuthorized = false;

    if (role === 'admin' || String(booking.user) === String(req.user._id)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

// DELETE /api/bookings/:id/incomplete - Delete an incomplete booking (payment failed/cancelled)
router.delete('/:id/incomplete', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow user to delete their own booking
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow deleting if it's unpaid
    if (booking.status !== 'awaiting_payment' && booking.paymentStatus !== 'failed' && booking.status !== 'failed') {
      return res.status(400).json({ message: 'Cannot delete a confirmed or completed booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    
    // Also try to delete any associated transactions
    try {
      const Transaction = (await import('../models/paymentModel.js')).default;
      await Transaction.deleteMany({ booking: req.params.id });
    } catch (e) {
      console.log('Error deleting associated transactions:', e.message);
    }

    res.json({ success: true, message: 'Incomplete booking removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

export default router;
