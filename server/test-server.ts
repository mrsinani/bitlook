import "./env-setup.js";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV,
    message: "TypeScript Express server is running correctly!",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
});
