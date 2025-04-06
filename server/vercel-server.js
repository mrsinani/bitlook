import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Import server and proxy modules
import "./proxy.js"; // Lightning proxy
import "./server.js"; // API server

// Enable CORS
app.use(cors());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vercel server running on port ${PORT}`);
});

export default app;
