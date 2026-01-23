const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure this path is correct
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/queue_system");
    console.log('🔌 DB Connected');

    // 1. DELETE EXISTING ADMIN (The Fix)
    const deleted = await User.findOneAndDelete({ username: 'admin' });
    if (deleted) {
        console.log('🗑️  Found old admin account... Deleted it.');
    }

    // 2. CREATE NEW ADMIN
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); // The known password

    const admin = new User({ 
        username: 'admin', 
        password: hashedPassword,
        role: 'admin' 
    });
    
    await admin.save();
    
    console.log('✅ NEW Admin Account Created!');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();