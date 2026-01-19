const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g., "Aadhar Update"
  averageTime: { 
    type: Number, 
    default: 10 
  }, // In minutes
  icon: {
    type: String,
    default: "default_icon.png"
  }
});

module.exports = mongoose.model('Service', ServiceSchema);