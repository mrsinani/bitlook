// Auth API endpoint for Vercel
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Auth API is running",
    services: {
      clerk: process.env.VITE_CLERK_PUBLISHABLE_KEY ? "configured" : "missing",
      supabase: process.env.VITE_SUPABASE_URL ? "configured" : "missing",
    },
  });
});

// Auth config endpoint
app.get("/auth/config", (req, res) => {
  res.status(200).json({
    clerk: {
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || "",
      configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
    },
    supabase: {
      url: process.env.VITE_SUPABASE_URL || "",
      anonKey: process.env.VITE_SUPABASE_KEY || "",
      configured: !!(
        process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_KEY
      ),
    },
  });
});

export default app;
