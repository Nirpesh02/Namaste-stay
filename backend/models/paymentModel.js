import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
  },
  hotelName: {
    type: String,
    required: true,
  },
  hotelId: {
    type: String,
    required: false,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_gateway: {
    type: String,
    required: true,
    enum: ['esewa', 'khalti'],
    default: 'esewa',
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  transactionCode: {
    type: String,
    default: null,
  },
  esewaRefId: {
    type: String,
    default: null,
  },
  productId: {
    type: String,
    required: true,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;