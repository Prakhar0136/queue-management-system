const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Route Imports
const queueRoute = require("./routes/queue");
const servicesRoute = require("./routes/services");
const authRoute = require("./routes/auth"); // 👈 IMPORT THIS

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Make sure this matches your Frontend URL
    methods: ["GET", "POST", "PUT"],
  },
});

app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/queue_system")
  .then(() => console.log("✅ DB Connection Successful"))
  .catch((err) => console.log(err));

// Pass 'io' to the queue route so it can emit events
app.use("/api/queue", queueRoute(io));
app.use("/api/services", servicesRoute);
app.use("/api/auth", authRoute); // 👈 USE THE ROUTE HERE

server.listen(5000, () => {
  console.log("🚀 Server is running on port 5000");
});