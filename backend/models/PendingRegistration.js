import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const pendingRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  accountType: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  verificationCode: {
    type: String,
    required: true,
    select: false,
  },
  verificationExpiresAt: {
    type: Date,
    required: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

pendingRegistrationSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  if (!this.isModified('password')) {
    return next();
  }

  // Skip hashing if password is already hashed (starts with bcrypt prefix)
  if (typeof this.password === 'string' && this.password.startsWith('$2')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;