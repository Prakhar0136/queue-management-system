const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Route Imports
const queueRoute = require("./routes/queue");
const servicesRoute = require("./routes/services");
const authRoute = require("./routes/auth"); 

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ CHANGED: Allow Cloud Port or fallback to 5000
const PORT = process.env.PORT || 5000;

// Socket.io Setup
const io = new Server(server, {
  cors: {
    // ✅ CHANGED: Allow connection from ANYWHERE (so your deployed frontend works)
    origin: "*", 
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
app.use("/api/auth", authRoute);

// ✅ CHANGED: Listen on the dynamic PORT variable
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});