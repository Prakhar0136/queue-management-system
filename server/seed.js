const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/queue_system";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  averageTime: { type: Number, required: true },
  icon: { type: String, required: true },
  nextService: { type: String, default: null } // The Relay Link
});

const ServiceType = mongoose.model("ServiceType", serviceSchema);

const services = [
  // --- THE "RELAY" CHAIN (Unique Feature) ---
  {
    name: "Document Verification",
    averageTime: 8,
    icon: "📄",
    nextService: "Biometrics Scan" // Links to next step
  },
  {
    name: "Biometrics Scan",
    averageTime: 5,
    icon: "🖐️",
    nextService: "Final Approval" // Links to next step
  },
  {
    name: "Final Approval",
    averageTime: 3,
    icon: "✅",
    nextService: null
  },

  // --- STANDARD SERVICES ---
  {
    name: "Passport Issuance",
    averageTime: 12,
    icon: "🛂",
    nextService: null
  },
  {
    name: "License Renewal",
    averageTime: 10,
    icon: "🚗",
    nextService: null
  },
  {
    name: "Land Registry",
    averageTime: 20,
    icon: "🏠",
    nextService: null
  },
  {
    name: "Tax Payment",
    averageTime: 7,
    icon: "💰",
    nextService: null
  },
  {
    name: "Birth Certificate",
    averageTime: 15,
    icon: "👶",
    nextService: null
  },
  {
    name: "General Inquiry",
    averageTime: 5,
    icon: "❓",
    nextService: null
  }
];

const seedDB = async () => {
  try {
    await ServiceType.deleteMany({});
    await ServiceType.insertMany(services);
    console.log("🌱 Database seeded with 9 Government Services!");
    mongoose.connection.close();
  } catch (error) {
    console.error(error);
    mongoose.connection.close();
  }
};

seedDB();