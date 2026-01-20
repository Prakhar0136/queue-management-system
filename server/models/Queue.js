const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceType",
    required: true,
  },
  status: {
    type: String,
    enum: ["waiting", "serving", "completed", "arriving"],
    default: "arriving", 
  },
  // 🆕 NEW FIELDS FOR TIME TRACKING
  servedAt: { type: Date },     // When admin clicked "Call"
  completedAt: { type: Date },  // When admin clicked "Complete"
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Queue", queueSchema);