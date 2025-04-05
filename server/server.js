import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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

// Bitcoin history endpoint
app.get("/api/bitcoin-history", async (req, res) => {
  try {
    const response = await axios.get(
      "https://mempool.space/api/v1/historical-price?currency=USD&timestamp="
    );
    const { time, USD } = response.data;

    res.status(200).json({ time, price: USD });
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin price" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
