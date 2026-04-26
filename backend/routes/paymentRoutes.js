import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import process from 'node:process';
import Booking from '../models/Booking.js';
import Transaction from '../models/paymentModel.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  buildEsewaPaymentFields,
  verifyEsewaPayment,
  getEsewaPaymentUrl,
} from '../utils/esewaUtils.js';
import { sendBookingConfirmationEmail } from '../utils/bookingEmail.js';

const router = express.Router();

router.post('/esewa/initiate', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Block if payment already completed
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed for this booking' });
    }

    // Block if booking was cancelled or failed — must create a new booking
    if (booking.status === 'cancelled' || booking.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate payment for a ${booking.status} booking. Please create a new booking.`,
      });
    }

    // Generate short unique transaction UUID (eSewa max length is strict)
    // Date.now() is 13 chars + hyphen + 6 random hex = 20 chars
    const transactionUuid = `${Date.now()}-${uuidv4().slice(0, 6)}`;

    // Save transaction UUID in booking
    booking.transactionId = transactionUuid;
    await booking.save();

    // Use actual request origin for security (not client-provided value)
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    // Note: eSewa will append ?data=<encoded_response> to these URLs
    const successUrl = `${origin}/payment/success`;
    const failureUrl = `${origin}/payment/failure`;

    const fields = buildEsewaPaymentFields({
      amount: booking.totalPrice,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    // Create transaction record
    await Transaction.create({
      booking: booking._id,
      user: req.user._id,
      customerDetails: {
        name: booking.guestName || req.user.name || 'Guest',
        email: booking.guestEmail || req.user.email || '',
        phone: booking.guestPhone || '',
      },
      hotelName: booking.hotelName,
      // Guard against String(null) = "null" — fall back to hotel name if no DB hotel doc
      hotelId: booking.hotel ? String(booking.hotel) : (booking.hotelName || ''),
      amount: booking.totalPrice,
      payment_gateway: 'esewa',
      status: 'PENDING',
      productId: transactionUuid,
    });

    res.json({
      success: true,
      paymentUrl: getEsewaPaymentUrl(),
      fields,
    });
  } catch (error) {
    console.error('eSewa initiate error:', error);
    res.status(500).json({ success: false, message: 'Error initiating payment', error: error.message });
  }
});

/**
 * GET /api/payments/esewa/verify
 * Called by the frontend after eSewa redirects back with payment data.
 * The encoded response data is passed as a query parameter 'data'.
 * eSewa will redirect to: success_url?data=<base64_encoded_response>
 */
router.get('/esewa/verify', async (req, res) => {
  try {
    const { data: encodedData } = req.query;

    if (!encodedData) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing eSewa response data. Payment verification cannot proceed.' 
      });
    }
    
    const result = verifyEsewaPayment(encodedData);

    if (!result.verified) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Payment verification failed. Please contact support if money was deducted.',
      });
    }

    const paymentData = result.data;
    
    const transactionUuid = paymentData.transaction_uuid;

    // Find the booking by transaction UUID
    const booking = await Booking.findOne({ transactionId: transactionUuid });
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found for this transaction. Please contact support.' 
      });
    }

    // Check if already completed to prevent duplicate confirmation
    if (booking.paymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and booking confirmed',
        booking: {
          id: booking._id,
          hotelName: booking.hotelName,
          roomType: booking.roomType,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice,
          transactionId: transactionUuid,
        },
      });
    }

    // If booking was cancelled or failed, we cannot re-confirm it via payment
    if (booking.status === 'cancelled' || booking.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: `This booking was ${booking.status} and cannot be confirmed. Please contact support if money was deducted.`,
      });
    }

    // Update booking to confirmed
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.esewaRefId = paymentData.transaction_code || paymentData.ref_id || '';
    await booking.save();

    // Update transaction record
    await Transaction.findOneAndUpdate(
      { productId: transactionUuid },
      {
        status: 'COMPLETED',
        transactionCode: paymentData.transaction_code || '',
        esewaRefId: paymentData.ref_id || '',
        verifiedAt: new Date(),
      },
      { new: true }
    );

    // Send confirmation email (non-blocking)
    try {
      await sendBookingConfirmationEmail({
        to: booking.guestEmail,
        name: booking.guestName,
        bookingDetails: {
          hotelName: booking.hotelName,
          roomType: booking.roomType,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          nights: booking.nights,
          totalPrice: booking.totalPrice,
          transactionId: transactionUuid,
          district: booking.district,
          province: booking.province,
        },
      });
    } catch {
      // Don't fail the payment verification if email fails
    }

    res.json({
      success: true,
      message: 'Payment verified successfully. Your booking is confirmed!',
      booking: {
        id: booking._id,
        hotelName: booking.hotelName,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalPrice: booking.totalPrice,
        transactionId: transactionUuid,
      },
    });
  } catch (error) {
    console.error('eSewa verify error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying payment. Please contact support.' 
    });
  }
});

/**
 * GET /api/payments/esewa/failure
 * Called when eSewa payment is cancelled, fails, or the user navigates away.
 * eSewa will redirect to: failure_url with encoded response data if applicable
 */
router.get('/esewa/failure', async (req, res) => {
  try {
    const { data: encodedData } = req.query;

    if (encodedData) {
      try {
        const result = verifyEsewaPayment(encodedData);
        if (result.data) {
          const transactionUuid = result.data.transaction_uuid;
          
          // Update booking status to failed
          const booking = await Booking.findOne({ transactionId: transactionUuid });
          if (booking) {
            booking.status = 'failed';
            booking.paymentStatus = 'failed';
            await booking.save();
          }

          // Update transaction
          await Transaction.findOneAndUpdate(
            { productId: transactionUuid, status: 'PENDING' },
            { status: 'FAILED', verifiedAt: new Date() }
          );
        }
      } catch {
        // Silently handle parse errors for failure endpoint
      }
    }

    res.json({
      success: false,
      message: 'Payment was cancelled or could not be completed. Your booking has been marked as failed and can be retried.',
    });
  } catch (error) {
    console.error('eSewa failure handler error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing payment failure' 
    });
  }
});

/**
 * POST /api/payments/cleanup-expired
 * Clean up expired 'awaiting_payment' bookings (older than 1 hour).
 * Can be called periodically or triggered on app start.
 * This prevents cluttering the database with abandoned bookings.
 */
router.post('/cleanup-expired', async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await Booking.updateMany(
      {
        status: 'awaiting_payment',
        createdAt: { $lt: oneHourAgo }
      },
      {
        status: 'failed',
        paymentStatus: 'failed'
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} expired awaiting_payment bookings`);

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} expired bookings`,
      cleanedUpCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error cleaning up expired bookings' 
    });
  }
});

export default router;