const express = require('express');
const router = express.Router();
const QueueEntry = require('../models/QueueEntry');
const auth = require('../middleware/auth');

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
            status: 'arriving'
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

// PUT /api/queue/update/:id - Update ticket status (served, completed)
router.put('/update/:id', async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'serving', 'completed'
        
        // Update the entry
        const entry = await QueueEntry.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true } // Return the updated document
        ).populate('serviceType');

        if (!entry) return res.status(404).json({ message: "Entry not found" });

        // --- REAL TIME TRIGGER ---
        const io = req.app.get('io');
        
        // 1. Notify the specific user (The phone screen updates)
        io.emit(`queue-update-${entry.serviceType._id}`, { 
            type: 'UPDATE', 
            entry 
        });

        // 2. If 'serving', maybe trigger a voice announcement on Public Display (Future feature)
        
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/queue/list/:serviceId - Get all waiting users for a service
router.get('/list/:serviceId', async (req, res) => {
    try {
        const list = await QueueEntry.find({ 
            serviceType: req.params.serviceId,
            status: { $in: ['waiting', 'serving'] } // Get waiting AND serving
        }).sort({ tokenNumber: 1 }); // Oldest first
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/queue/checkin/:id - User confirms they are at the location
router.put('/checkin/:id', async (req, res) => {
    try {
        const entry = await QueueEntry.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: "Ticket not found" });

        // Change status to 'waiting' so Admin can see them
        entry.status = 'waiting';
        await entry.save();

        // Notify Admin that someone new has "appeared" in the waiting line
        const io = req.app.get('io');
        // We populate serviceType so the frontend has the service name/ID
        await entry.populate('serviceType');
        
        io.emit(`queue-update-${entry.serviceType._id}`, { 
            type: 'CHECKIN', 
            entry 
        });

        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/queue/display - Get all tickets currently 'serving'
router.get('/display', async (req, res) => {
    try {
        const serving = await QueueEntry.find({ status: 'serving' })
            .populate('serviceType')
            .sort({ updatedAt: -1 }); // Most recently updated first
        
        res.json(serving);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;