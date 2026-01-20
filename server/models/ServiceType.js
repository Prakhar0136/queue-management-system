const mongoose = require("mongoose");

const serviceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  averageTime: { type: Number, required: true },
  icon: { type: String, required: true },
  nextService: { type: String, default: null }, // 🆕 Added field
});

module.exports = mongoose.model("ServiceType", serviceTypeSchema);