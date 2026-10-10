const express = require("express");

const {
  getBarangays,
  createBarangay,
} = require("../controllers/barangayController");

const router = express.Router();

router.get("/", getBarangays);
router.post("/", createBarangay);

module.exports = router;