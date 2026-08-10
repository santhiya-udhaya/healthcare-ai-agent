const express = require("express");
const router = express.Router();

const {
  getMyVitals,
  saveVitals,
} = require("../controllers/vitalController");

const { protect } = require("../middleware/auth");

router.get("/me", protect, getMyVitals);

router.post("/", protect, saveVitals);

module.exports = router;