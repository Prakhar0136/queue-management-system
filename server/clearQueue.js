const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Queue = require("./models/Queue"); // Adjust path if needed

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/queue_system")
  .then(async () => {
    console.log("✅ Connected. Clearing Queue...");
    await Queue.deleteMany({});
    console.log("🗑️  Queue Cleared!");
    mongoose.connection.close();
  })
  .catch(err => console.log(err));