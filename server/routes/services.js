const router = require("express").Router();
const ServiceType = require("../models/ServiceType");

// GET ALL SERVICES
router.get("/", async (req, res) => {
  try {
    const services = await ServiceType.find();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE A SERVICE (For testing/admin)
router.post("/", async (req, res) => {
  try {
    const newService = new ServiceType(req.body);
    const savedService = await newService.save();
    res.status(200).json(savedService);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;