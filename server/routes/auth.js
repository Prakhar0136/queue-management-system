const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 1. Basic Validation
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    // 2. Check for existing user in MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    // 3. Validate Password
    // We compare the plain text password (from frontend) 
    // with the hashed password (from database)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 4. Create JWT Token
    // The dashboard needs this to verify identity on every request
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "mysecretkey", // Fallback if .env is missing
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // 5. Send Token to Frontend
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;