const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

// Data to insert
const services = [
  { 
    name: "Aadhar Update", 
    averageTime: 15, // 15 mins
    icon: "🆔" 
  },
  { 
    name: "Driver's License", 
    averageTime: 20, 
    icon: "🚗" 
  },
  { 
    name: "Passport Inquiry", 
    averageTime: 10, 
    icon: "✈️" 
  },
  { 
    name: "Land Registry", 
    averageTime: 30, 
    icon: "🏠" 
  },
  { 
    name: "Pension Scheme", 
    averageTime: 12, 
    icon: "👴" 
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to DB...');

    // Clear existing data
    await Service.deleteMany({});
    console.log('🧹 Old services cleared!');

    // Insert new data
    await Service.insertMany(services);
    console.log('✅ Services Seeded Successfully!');

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

seedDB();