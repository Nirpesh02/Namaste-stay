import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const clean = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Booking = (await import('./models/Booking.js')).default;
  const Transaction = (await import('./models/paymentModel.js')).default;
  
  const resB = await Booking.deleteMany({ status: { $ne: 'confirmed' } });
  const resT = await Transaction.deleteMany({ status: { $ne: 'COMPLETED' } });
  
  console.log('Cleaned up:', resB.deletedCount, 'bookings and', resT.deletedCount, 'transactions');
  await mongoose.disconnect();
};

clean();
