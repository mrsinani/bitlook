import "./env-setup.js";
import express from "express";
import cors from "cors";
import axios from "axios";
import { runWorkflow, getExecutionTrace } from "./langchain/index.js";

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

// AI Agent workflow endpoint - Using real LangGraph implementation
app.post("/api/ai/workflow", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Use the real LangGraph workflow implementation
    const result = await runWorkflow(input);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error running AI workflow:", error);
    res.status(500).json({
      error: "Failed to process request",
      input: req.body.input || "",
      plan: [],
      pastSteps: [
        [
          "Error",
          `The AI agent encountered an error: ${
            error.message || "Unknown error"
          }`,
        ],
      ],
      response:
        "I'm unable to process your request at the moment. The AI services might be unavailable or misconfigured. Please contact the administrator for assistance.",
      needsReplan: false,
    });
  }
});

// Execution trace endpoint - Using real LangGraph implementation
app.post("/api/ai/trace", async (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: "State object is required" });
    }

    // Use the real execution trace generator
    const trace = getExecutionTrace(state);

    res.status(200).json({ trace });
  } catch (error: unknown) {
    console.error("Error generating execution trace:", error);
    res.status(500).json({
      error: "Failed to generate execution trace",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
