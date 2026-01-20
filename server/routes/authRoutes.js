const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER (Create a new Admin)
// In a real app, you might disable this route after creating the first admin
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Hash the password (Encryption)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Admin created successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. LOGIN (Get the Token)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Generate Token (The Key Card)
        // 'secret123' should be in .env, but for now we keep it simple
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;