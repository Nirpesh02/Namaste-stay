import User from '../models/User.js';

/**
 * Seed the default admin account if it doesn't already exist.
 * Called once at server startup.
 */
export const seedAdminAccount = async () => {
  try {
    const adminEmail = 'hotels@nepal.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      // Ensure the role/accountType is admin
      if (existing.accountType !== 'admin' || existing.role !== 'admin') {
        existing.accountType = 'admin';
        existing.role = 'admin';
        await existing.save();
        console.log('Admin account role updated.');
      }
      return;
    }

    const admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: '123456',
      accountType: 'admin',
      role: 'admin',
      emailVerified: true,
      authProvider: 'email',
      isActive: true,
    });

    await admin.save();
    console.log('Default admin account created: hotels@nepal.com');
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
};
