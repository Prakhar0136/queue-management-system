const router = require("express").Router();
const Queue = require("../models/Queue");
const ServiceType = require("../models/ServiceType");
const sendNotification = require("../utils/mailer");

module.exports = (io) => {
  
  // ---------------------------------------------------------
  // 1. JOIN QUEUE
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // 1. JOIN QUEUE
  // ---------------------------------------------------------
  router.post("/join", async (req, res) => {
    try {
      console.log("👉 JOIN REQUEST:", req.body); 

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastTicket = await Queue.findOne({ createdAt: { $gte: today } }).sort({ createdAt: -1 });
      const nextToken = lastTicket ? lastTicket.tokenNumber + 1 : 100;

      const newTicket = new Queue({
        tokenNumber: nextToken,
        serviceType: req.body.serviceId,
        status: "waiting", 
        // 👇 ADD THIS LINE TO SAVE THE NAME
        customerName: req.body.name || "Guest", 
        email: req.body.email, 
        phone: req.body.phone
      });

      const savedTicket = await newTicket.save();
      console.log("✅ Ticket Saved:", savedTicket.tokenNumber); 
      
      io.emit("queue-update"); 
      res.status(200).json(savedTicket);
    } catch (err) {
      console.error("❌ Join Error:", err);
      res.status(500).json(err);
    }
  });
  // ---------------------------------------------------------
  // 2. UPDATE STATUS (WITH EMAIL DEBUGGING)
  // ---------------------------------------------------------
  router.put("/update/:id", async (req, res) => {
    try {
      const { status } = req.body;
      console.log("\n------------------------------------------------");
      console.log("👉 UPDATE REQUEST: Changing status to", status);

      const ticket = await Queue.findByIdAndUpdate(
        req.params.id, 
        { status }, 
        { new: true }
      ).populate("serviceType"); 

      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      // DEBUG LOGS
      if (status === "serving") {
          console.log(`🔎 Serving Ticket #${ticket.tokenNumber}`);
          console.log(`   - Email in DB: ${ticket.email}`);

          if (ticket.email) {
             console.log("✅ CONDITIONS PASSED. Sending email...");
             sendNotification(ticket.email, ticket.tokenNumber, ticket.serviceType.name);
          } else {
             console.log("⚠️ SKIPPING EMAIL: Ticket has no email address.");
          }
      }

      io.emit("queue-update");
      res.json(ticket);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  // ---------------------------------------------------------
  // 3. GET TICKET DETAILS (THIS WAS MISSING!)
  // ---------------------------------------------------------
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
      console.error("Details Error:", err);
      res.status(500).json(err);
    }
  });

  // ---------------------------------------------------------
  // 4. DISPLAY BOARD
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 5. ANALYTICS
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // 5. ANALYTICS (Crash-Proof Version)
  // ---------------------------------------------------------
  router.get("/analytics", async (req, res) => {
    try {
      // 1. Total Served (Only counts 'completed' tickets)
      const totalServed = await Queue.countDocuments({ status: "completed" });

      // 2. Most Popular Service
      const popularity = await Queue.aggregate([
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);

      let mostPopularName = "N/A";
      
      // SAFE CHECK: Ensure we found a popular service AND it has a valid ID
      if (popularity.length > 0 && popularity[0]._id) {
        const service = await ServiceType.findById(popularity[0]._id);
        // If service was deleted but tickets exist, fallback to "Unknown"
        mostPopularName = service ? service.name : "Unknown Service";
      }

      // 3. Hourly Traffic (Based on creation time)
      const hourlyStats = await Queue.aggregate([
        { $project: { hour: { $hour: "$createdAt" } } },
        { $group: { _id: "$hour", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      // Fill missing hours with 0
      const chartData = Array(24).fill(0);
      hourlyStats.forEach(item => {
          if (item._id >= 0 && item._id < 24) {
            chartData[item._id] = item.count;
          }
      });

      res.status(200).json({ 
          totalServed, 
          mostPopular: mostPopularName, 
          chartData 
      });

    } catch (err) {
      console.error("Analytics Error:", err);
      res.status(500).json({ msg: "Analytics failed" });
    }
  });

  // POST: /api/queue/snooze/:id
// Swaps the current ticket with the next one in line
// ... inside queue.js

router.post("/snooze/:id", async (req, res) => {
  try {
    const ticket = await Queue.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    if (ticket.status !== "waiting") return res.status(400).json({ msg: "Can only snooze while waiting" });

    // 1. Find person behind
    const nextTicket = await Queue.findOne({
      serviceType: ticket.serviceType,
      status: "waiting",
      createdAt: { $gt: ticket.createdAt }
    }).sort({ createdAt: 1 });

    if (!nextTicket) return res.status(400).json({ msg: "You are already the last person in line!" });

    // 2. Swap Times
    const myTime = ticket.createdAt;
    const theirTime = nextTicket.createdAt;
    ticket.createdAt = theirTime;
    nextTicket.createdAt = myTime;

    // 3. Save
    await ticket.save();
    await nextTicket.save();

    // 4. Update Everyone (Use 'io', NOT 'req.io')
    io.emit("queue-update"); // 👈 THIS WAS THE BUG

    res.json({ msg: "Snoozed! You moved back 1 spot." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

  return router;
};