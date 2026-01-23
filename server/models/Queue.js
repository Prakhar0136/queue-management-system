const mongoose = require("mongoose");

const QueueSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  serviceType: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceType" },
  status: { 
    type: String, 
    enum: ["waiting", "serving", "completed", "arriving"], 
    default: "waiting" 
  },
  // 👇 ADD THIS FIELD
  customerName: { type: String }, 
  
  email: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  servedAt: { type: Date },
  completedAt: { type: Date }
});

module.exports = mongoose.model("Queue", QueueSchema);