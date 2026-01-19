const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET /api/services - Get all available services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;