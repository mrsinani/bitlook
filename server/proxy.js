const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Lightning proxy server is running" });
});

// Voltage connection debug endpoint
app.get("/debug", async (req, res) => {
  console.log("Debug endpoint called - testing Voltage connection");
  try {
    // Test direct connection to Voltage
    console.log(`Attempting to connect to Voltage node at: ${FULL_API_URL}`);
    console.log(
      `Using macaroon: ${VOLTAGE_ADMIN_MACAROON.substring(0, 20)}...`
    );

    const response = await axios.get(`${FULL_API_URL}/v1/getinfo`, {
      headers: getVoltageHeaders(),
    });

    // If successful, return node info
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
      voltage_api: {
        url: VOLTAGE_API_URL,
        port: REST_PORT,
        full_url: FULL_API_URL,
      },
    });
  } catch (error) {
    // Log detailed error info
    console.error("Failed to connect to Voltage node:");
    console.error("Error message:", error.message);

    if (error.code) {
      console.error("Error code:", error.code);
    }

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status text:", error.response.statusText);
      console.error("Response data:", error.response.data);
    }

    // Return error details
    res.status(500).json({
      success: false,
      message: "Failed to connect to Voltage node",
      error: error.message,
      code: error.code,
      voltage_api: {
        url: VOLTAGE_API_URL,
        port: REST_PORT,
        full_url: FULL_API_URL,
      },
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          }
        : null,
    });
  }
});

// Voltage API configuration
const VOLTAGE_API_URL =
  process.env.api_endpoint || "http://bitlook.u.voltageapp.io";
const REST_PORT = process.env.rest_port || "8080";
const VOLTAGE_ADMIN_MACAROON =
  process.env.admin_macaroon ||
  "AgEDbG5kAvgBAwoQhZoJs+As7BQ4cCHL2j653BIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgvumszVypBaxQgkKBdosgfRl6/JDSA+pGaodk2c3SwoA=";

// Full API URL
const FULL_API_URL = `${VOLTAGE_API_URL}:${REST_PORT}`;

console.log(`Connecting to Voltage node at: ${FULL_API_URL}`);

// Helper function to create Voltage API request headers
const getVoltageHeaders = () => ({
  "Grpc-Metadata-macaroon": VOLTAGE_ADMIN_MACAROON,
  "Content-Type": "application/json",
});

// Proxy endpoint for wallet balance
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

// Proxy endpoint for getting node info
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

// Proxy endpoint for invoices
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

// Proxy endpoint for creating invoice
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

// Proxy endpoint for payments
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

// Proxy endpoint for paying an invoice
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

// Proxy endpoint for decoding invoice
app.get("/api/lightning/decode/:payreq", async (req, res) => {
  try {
    const payreq = req.params.payreq;
    const response = await axios.get(`${FULL_API_URL}/v1/payreq/${payreq}`, {
      headers: getVoltageHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error decoding invoice:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Lightning proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(
    `Balance endpoint: http://localhost:${PORT}/api/lightning/balance`
  );

  // Test connection to Voltage in the background
  setTimeout(async () => {
    try {
      const response = await axios.get(`${FULL_API_URL}/v1/getinfo`, {
        headers: getVoltageHeaders(),
      });
      console.log("✅ Successfully connected to Voltage node!");
      console.log(`Node alias: ${response.data.alias}`);
    } catch (error) {
      console.error("⚠️ Could not connect to Voltage node:", error.message);
      console.error("The API will return mock data for development");
    }
  }, 1000);
});
