const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 DB Connected');

    // Check if admin exists
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
        console.log('⚠️ Admin already exists');
        process.exit();
    }

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); // Default password: admin123

    const admin = new User({ username: 'admin', password: hashedPassword });
    await admin.save();
    
    console.log('✅ Admin Account Created!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

createAdmin();