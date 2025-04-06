// Main API server for Vercel serverless functions
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server API is running" });
});

// Bitcoin price endpoint
app.get("/api/bitcoin-price", async (req, res) => {
  try {
    const response = await axios.get("https://mempool.space/api/v1/prices");
    const { time, USD } = response.data;
    res.status(200).json({ time, price: USD });
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin price" });
  }
});

// Bitcoin history endpoint with fallback
app.get("/api/bitcoin-history", async (req, res) => {
  try {
    const response = await axios.get(
      "https://mempool.space/api/v1/historical-price",
      {
        params: { currency: "USD" },
        timeout: 5000,
      }
    );

    // Return the historical data
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching Bitcoin history:", error);

    // Return sample fallback data
    const fallbackData = getSampleHistoricalData();
    res.status(200).json(fallbackData);
  }
});

// Function to generate fallback sample historical data
function getSampleHistoricalData() {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 86400;
  let price = 26000;

  // Generate 180 days of sample data
  for (let i = 0; i < 180; i++) {
    // Add some random variation to price
    const randomChange = (Math.random() - 0.5) * 1000;
    price = Math.max(5000, price + randomChange);

    data.push({
      time: now - (179 - i) * dayInSeconds,
      USD: price,
    });
  }

  return data;
}

// Root handler for Vercel
app.get("/", (req, res) => {
  res.json({ status: "BitLook Server API is running on Vercel" });
});

export default app;
