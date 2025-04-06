import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Voltage API configuration
const VOLTAGE_API_URL =
  process.env.api_endpoint || "http://bitlook.u.voltageapp.io";
const REST_PORT = process.env.rest_port || "8080";
const VOLTAGE_ADMIN_MACAROON =
  process.env.admin_macaroon ||
  "AgEDbG5kAvgBAwoQhZoJs+As7BQ4cCHL2j653BIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgvumszVypBaxQgkKBdosgfRl6/JDSA+pGaodk2c3SwoA=";

// Full API URL
const FULL_API_URL = `${VOLTAGE_API_URL}:${REST_PORT}`;

console.log("==========================================");
console.log("Voltage Node Connection Debug");
console.log("==========================================");
console.log("API URL:", VOLTAGE_API_URL);
console.log("REST Port:", REST_PORT);
console.log("Full URL:", FULL_API_URL);
console.log("Macaroon is set:", !!VOLTAGE_ADMIN_MACAROON);
console.log("==========================================");

// Helper function to create Voltage API request headers
const getVoltageHeaders = () => ({
  "Grpc-Metadata-macaroon": VOLTAGE_ADMIN_MACAROON,
  "Content-Type": "application/json",
});

async function testNodeConnection() {
  try {
    console.log("Testing connection to the node...");
    const response = await axios.get(`${FULL_API_URL}/v1/getinfo`, {
      headers: getVoltageHeaders(),
    });

    console.log("✅ Successfully connected to Voltage node!");
    console.log("Node Info:");
    console.log("- Alias:", response.data.alias);
    console.log("- Pubkey:", response.data.identity_pubkey);
    console.log("- Version:", response.data.version);
    console.log("- Active Channels:", response.data.num_active_channels);
    console.log("- Connected Peers:", response.data.num_peers);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Voltage node:");
    console.error("Error details:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\nPossible solutions:");
      console.log(
        "1. Check if your Voltage node is online in the Voltage dashboard"
      );
      console.log(
        "2. Verify that the api_endpoint and rest_port in .env are correct"
      );
      console.log(
        "3. The node might be behind a firewall or not accessible from your network"
      );
    }

    if (error.response && error.response.status === 401) {
      console.log("\nAuthentication error:");
      console.log("1. Check if the admin_macaroon in .env is correct");
      console.log("2. Get a fresh macaroon from your Voltage dashboard");
    }

    return false;
  }
}

// Test wallet balance endpoint
async function testWalletBalance() {
  try {
    console.log("\nTesting wallet balance endpoint...");
    const response = await axios.get(`${FULL_API_URL}/v1/balance/blockchain`, {
      headers: getVoltageHeaders(),
    });

    console.log("✅ Successfully retrieved wallet balance!");
    console.log("Balance details:");
    console.log("- Confirmed:", response.data.confirmed_balance, "sats");
    console.log("- Unconfirmed:", response.data.unconfirmed_balance, "sats");
    console.log("- Total:", response.data.total_balance, "sats");
    return true;
  } catch (error) {
    console.error("❌ Failed to retrieve wallet balance:");
    console.error("Error details:", error.message);
    return false;
  }
}

// Run the tests
(async () => {
  const nodeOk = await testNodeConnection();
  if (nodeOk) {
    await testWalletBalance();
  }

  console.log("\n==========================================");
  if (nodeOk) {
    console.log("✅ All tests completed! The node appears to be accessible.");
    console.log("You can now start the proxy server with: node proxy.js");
  } else {
    console.log(
      "❌ Tests failed! Please fix the connection issues before starting the proxy server."
    );
  }
  console.log("==========================================");
})();
