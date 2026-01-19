const mongoose = require('mongoose');

const QueueEntrySchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true 
  },
  serviceType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  tokenNumber: { 
    type: Number, 
    required: true 
  }, // e.g., 101, 102
  status: { 
    type: String, 
    enum: ['waiting', 'serving', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('QueueEntry', QueueEntrySchema);