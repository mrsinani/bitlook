// Vercel Serverless Function Adapter
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Create Express app for Vercel serverless functions
const app = express();
app.use(cors());

// Import server and proxy functionality
// Note: We're wrapping these in try/catch because they might have
// direct server startup code that we don't want to execute immediately
try {
  const serverModule = await import("./server.js");
  const proxyModule = await import("./proxy.js");

  // If the modules export app instances, use them as middleware
  if (serverModule.default && typeof serverModule.default === "function") {
    app.use("/api", serverModule.default);
  }

  if (proxyModule.default && typeof proxyModule.default === "function") {
    app.use("/proxy", proxyModule.default);
  }
} catch (err) {
  console.error("Error loading server modules:", err);
}

// Export the serverless function handler
export default app;
