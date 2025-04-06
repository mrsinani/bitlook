// Ethereum Contracts API endpoint for Vercel
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Mock contract data for deployment
// In a real scenario, you'd deploy your contracts to testnet/mainnet
// and provide their addresses in environment variables
const CONTRACT_DATA = {
  votingContract: {
    address:
      process.env.VITE_VOTING_CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    network: process.env.VITE_NETWORK || "development",
    deployed: true,
    blockNumber: 12345678,
  },
};

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Ethereum Contracts API is running on Vercel" });
});

// Get contract addresses endpoint
app.get("/api/contracts/addresses", (req, res) => {
  res.json({
    success: true,
    contracts: CONTRACT_DATA,
  });
});

// This would be for testnet/mainnet - not needed for demo
app.get("/api/contracts/status", (req, res) => {
  res.json({
    success: true,
    status: "Contracts are deployed and operational",
    network: process.env.VITE_NETWORK || "development",
    contracts: Object.keys(CONTRACT_DATA).map((key) => ({
      name: key,
      address: CONTRACT_DATA[key].address,
      deployed: CONTRACT_DATA[key].deployed,
    })),
  });
});

export default app;
