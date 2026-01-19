const express = require('express');
const router = express.Router();
const QueueEntry = require('../models/QueueEntry');

// POST /api/queue/join - Join a queue
router.post('/join', async (req, res) => {
    const { phone, serviceId } = req.body;

    try {
        // 1. Find last token
        const lastEntry = await QueueEntry.findOne({ serviceType: serviceId })
            .sort({ tokenNumber: -1 });

        const newToken = lastEntry ? lastEntry.tokenNumber + 1 : 1;

        // 2. Create entry
        const newEntry = new QueueEntry({
            phone,
            serviceType: serviceId,
            tokenNumber: newToken,
            status: 'waiting'
        });

        await newEntry.save();

        // --- REAL TIME MAGIC HAPPENS HERE ---
        // We broadcast an event saying "Queue updated for this Service ID"
        // The frontend will listen for this specific ID.
        const io = req.app.get('io'); // Get the socket instance
        io.emit(`queue-update-${serviceId}`, { type: 'JOIN', entry: newEntry });
        // ------------------------------------

        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/queue/details/:id - Get details of a specific ticket (NEW)
router.get('/details/:id', async (req, res) => {
    try {
        const entry = await QueueEntry.findById(req.params.id).populate('serviceType');
        if (!entry) return res.status(404).json({ message: "Ticket not found" });
        
        // Calculate how many people are ahead
        const peopleAhead = await QueueEntry.countDocuments({
            serviceType: entry.serviceType._id,
            status: 'waiting',
            tokenNumber: { $lt: entry.tokenNumber } // Tokens smaller than mine
        });

        res.json({ ...entry.toObject(), peopleAhead });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;