// Serverless API endpoint for Vercel
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Voltage API configuration (from environment or defaults)
const VOLTAGE_API_URL =
  process.env.api_endpoint || "http://bitlook.u.voltageapp.io";
const REST_PORT = process.env.rest_port || "8080";
const VOLTAGE_ADMIN_MACAROON =
  process.env.admin_macaroon || "default_macaroon_placeholder";

// Full API URL
const FULL_API_URL = `${VOLTAGE_API_URL}:${REST_PORT}`;

// Helper function to create Voltage API request headers
const getVoltageHeaders = () => ({
  "Grpc-Metadata-macaroon": VOLTAGE_ADMIN_MACAROON,
  "Content-Type": "application/json",
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Vercel API is running" });
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

// Lightning proxy endpoints
app.get("/api/lightning/balance", async (req, res) => {
  try {
    const response = await axios.get(`${FULL_API_URL}/v1/balance/blockchain`, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching balance:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/lightning/info", async (req, res) => {
  try {
    const response = await axios.get(`${FULL_API_URL}/v1/getinfo`, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching node info:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/lightning/invoice", async (req, res) => {
  try {
    const response = await axios.post(`${FULL_API_URL}/v1/invoices`, req.body, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Root handler for Vercel
app.get("/", (req, res) => {
  res.json({ status: "Bitlook API is running on Vercel" });
});

// Export the Express app as the Vercel serverless function
export default app;
