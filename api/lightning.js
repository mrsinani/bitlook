// Lightning Proxy API endpoint for Vercel
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Voltage API configuration
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
app.get("/", (req, res) => {
  res.json({ status: "Lightning proxy is running on Vercel" });
});

// Debug endpoint to check Voltage connection
app.get("/debug", async (req, res) => {
  try {
    const response = await axios.get(`${FULL_API_URL}/v1/getinfo`, {
      headers: getVoltageHeaders(),
    });

    res.json({
      success: true,
      message: "Successfully connected to Voltage node",
      node: {
        alias: response.data.alias,
        pubkey: response.data.identity_pubkey,
        version: response.data.version,
        channels: response.data.num_active_channels,
        peers: response.data.num_peers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to connect to Voltage node",
      error: error.message,
    });
  }
});

// Proxy endpoints for Lightning API
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

app.get("/api/lightning/invoices", async (req, res) => {
  try {
    const response = await axios.get(`${FULL_API_URL}/v1/invoices`, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching invoices:", error.message);
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

app.get("/api/lightning/payments", async (req, res) => {
  try {
    const response = await axios.get(`${FULL_API_URL}/v1/payments`, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/lightning/pay", async (req, res) => {
  try {
    const response = await axios.post(
      `${FULL_API_URL}/v1/channels/transactions`,
      req.body,
      { headers: getVoltageHeaders() }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error paying invoice:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default app;
