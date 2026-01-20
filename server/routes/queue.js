const router = require("express").Router();
const Queue = require("../models/Queue");
const ServiceType = require("../models/ServiceType");

module.exports = (io) => {
  
  // 1. JOIN QUEUE
  router.post("/join", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastTicket = await Queue.findOne({ createdAt: { $gte: today } }).sort({ createdAt: -1 });
      const nextToken = lastTicket ? lastTicket.tokenNumber + 1 : 100;

      const newTicket = new Queue({
        tokenNumber: nextToken,
        serviceType: req.body.serviceId,
        status: "arriving", 
      });

      const savedTicket = await newTicket.save();
      res.status(200).json(savedTicket);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // 2. GET DETAILS (WITH AI TIME PREDICTION)
  router.get("/details/:id", async (req, res) => {
    try {
      const ticket = await Queue.findById(req.params.id).populate("serviceType");
      if(!ticket) return res.status(404).json({message: "Ticket not found"});

      const peopleAhead = await Queue.countDocuments({
        serviceType: ticket.serviceType._id,
        status: { $in: ["waiting", "serving"] },
        createdAt: { $lt: ticket.createdAt },
      });

      const recentHistory = await Queue.find({
        serviceType: ticket.serviceType._id,
        status: "completed",
        servedAt: { $exists: true },
        completedAt: { $exists: true }
      }).sort({ completedAt: -1 }).limit(5);

      let averageDuration = ticket.serviceType.averageTime; 
      if (recentHistory.length > 0) {
        const totalDuration = recentHistory.reduce((acc, t) => {
            return acc + (new Date(t.completedAt) - new Date(t.servedAt));
        }, 0);
        averageDuration = (totalDuration / recentHistory.length) / 1000 / 60;
      }

      const estimatedWaitTime = Math.round(peopleAhead * averageDuration);

      res.status(200).json({ 
          ...ticket._doc, 
          peopleAhead, 
          estimatedWaitTime: estimatedWaitTime < 0 ? 0 : estimatedWaitTime 
      });
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // 3. DISPLAY BOARD
  router.get("/display", async (req, res) => {
    try {
        const allActive = await Queue.find({ 
            status: { $in: ["serving", "waiting", "arriving"] } 
        }).populate("serviceType");
        res.status(200).json(allActive);
    } catch (err) {
        res.status(500).json(err);
    }
  });

  // 4. GPS CHECK-IN
  router.put("/checkin/:id", async (req, res) => {
    try {
      const ticket = await Queue.findByIdAndUpdate(
        req.params.id,
        { status: "waiting" },
        { new: true }
      ).populate("serviceType");

      io.emit("queue-update"); 
      res.status(200).json(ticket);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // ---------------------------------------------------------
  // 🆕 5. UPDATE STATUS (WITH AUTO-RELAY LOGIC)
  // ---------------------------------------------------------
  router.put("/status/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const updateData = { status };

      if (status === "serving") updateData.servedAt = new Date();
      if (status === "completed") updateData.completedAt = new Date();

      // Update the current ticket
      const ticket = await Queue.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate("serviceType");

      // 🚨 RELAY LOGIC: If completed, check for next step
      if (status === "completed" && ticket.serviceType.nextService) {
          
          // Find the ID of the next service
          const nextServiceObj = await ServiceType.findOne({ name: ticket.serviceType.nextService });
          
          if (nextServiceObj) {
              // Create a new ticket automatically
              // We keep the SAME token number so the user doesn't get confused!
              const nextTicket = new Queue({
                  tokenNumber: ticket.tokenNumber, // Keep same number
                  serviceType: nextServiceObj._id,
                  status: "waiting", // Auto-join as waiting (skip arriving)
                  createdAt: new Date() // Fresh timestamp puts them at end of line (or manipulate this to put at top)
              });
              
              await nextTicket.save();
              console.log(`🔀 Auto-relayed Token ${ticket.tokenNumber} to ${nextServiceObj.name}`);
          }
      }

      io.emit("queue-update");
      res.status(200).json(ticket);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  });

  // 6. ANALYTICS
  router.get("/analytics", async (req, res) => {
    try {
      const totalServed = await Queue.countDocuments({ status: "completed" });
      const popularity = await Queue.aggregate([
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      let mostPopularName = "N/A";
      if (popularity.length > 0) {
        const service = await ServiceType.findById(popularity[0]._id);
        mostPopularName = service ? service.name : "Unknown";
      }
      const hourlyStats = await Queue.aggregate([
        { $project: { hour: { $hour: "$createdAt" } } },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      const chartData = Array(24).fill(0);
      hourlyStats.forEach(item => chartData[item._id] = item.count);

      res.status(200).json({ totalServed, mostPopular: mostPopularName, chartData });
    } catch (err) {
      res.status(500).json(err);
    }
  });

  return router;
};