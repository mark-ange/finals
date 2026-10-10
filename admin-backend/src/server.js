const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const incidentRoutes = require("./routes/incidentRoutes");
const authRoutes = require("./routes/authRoutes");
const barangayRoutes = require("./routes/barangayRoutes");
const fleetRoutes = require("./routes/fleetRoutes");

app.use(
  "/api/incidents",
  incidentRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/barangays",
  barangayRoutes
);

app.use(
  "/api/fleet",
  fleetRoutes
);

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message:
      "Admin backend test route works",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message:
      "CityCare Admin Backend is running",
  });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully!"
    );

    app.listen(PORT, () => {
      console.log(
        `Admin Backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  });