const express = require('express');
const router = express.Router();
const QueueEntry = require('../models/QueueEntry');

// POST /api/queue/join - Join a queue
router.post('/join', async (req, res) => {
    const { phone, serviceId } = req.body;

    try {
        // 1. Find the last token number for this service to increment it
        const lastEntry = await QueueEntry.findOne({ serviceType: serviceId })
            .sort({ tokenNumber: -1 });

        const newToken = lastEntry ? lastEntry.tokenNumber + 1 : 1;

        // 2. Create new entry
        const newEntry = new QueueEntry({
            phone,
            serviceType: serviceId,
            tokenNumber: newToken,
            status: 'waiting'
        });

        await newEntry.save();

        // TODO: Emit Socket Event here later!

        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/queue/status/:serviceId - Get status for a specific service
router.get('/status/:serviceId', async (req, res) => {
    try {
        const waitingCount = await QueueEntry.countDocuments({ 
            serviceType: req.params.serviceId, 
            status: 'waiting' 
        });
        res.json({ waitingCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;