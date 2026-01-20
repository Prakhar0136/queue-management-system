    const router = require("express").Router();

// Simple PIN Authentication (Hardcoded for demo: "1234")
router.post("/login", (req, res) => {
  const { pin } = req.body;

  // You can change "1234" to any password you want
  if (pin === "1234") {
    res.status(200).json({ success: true, message: "Access Granted" });
  } else {
    res.status(401).json({ success: false, message: "Invalid Access Code" });
  }
});

module.exports = router;