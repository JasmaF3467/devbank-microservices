const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check endpoint - useful for ECS/ALB health checks
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

// Sample API endpoint the frontend will call
app.get("/api/status", (req, res) => {
  res.json({
    message: "DevBank backend service is running",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend service listening on port ${PORT}`);
});
