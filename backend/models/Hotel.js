import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  size: { type: String, default: '250 sq ft' },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: String, default: '2 guests' },
  available: { type: Number, default: 5, min: 0 },
});

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  district: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  province: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [{
    type: String,
  }],
  coverImage: {
    type: String,
    default: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
  },
  amenities: [{
    type: String,
  }],
  roomTypes: [roomTypeSchema],
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  totalRooms: {
    type: Number,
    default: 10,
    min: 0,
  },
  availableRooms: {
    type: Number,
    default: 8,
    min: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Text search index
hotelSchema.index({ name: 'text', district: 'text', province: 'text' });

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
