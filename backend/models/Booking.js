import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: false,
    index: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: false,
  },
  province: {
    type: String,
    default: '',
  },
  roomType: {
    type: String,
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  nights: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['awaiting_payment', 'confirmed', 'cancelled', 'completed', 'failed'],
    default: 'awaiting_payment',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'cash'],
    default: 'esewa',
  },
  transactionId: {
    type: String,
    default: null,
  },
  esewaRefId: {
    type: String,
    default: null,
  },
  guestName: {
    type: String,
    default: '',
  },
  guestEmail: {
    type: String,
    default: '',
  },
  guestPhone: {
    type: String,
    default: '',
  },
  specialRequests: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Prevent overlapping bookings for same hotel + room type
bookingSchema.index({ hotel: 1, roomType: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
