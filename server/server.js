import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { runWorkflow, getExecutionTrace } from "./langgraph/index.js";

// Load environment variables
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

// For development: Mock API integrations if API keys are not available
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  // Provide mock values for required API keys in development
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "your_openai_api_key"
  ) {
    process.env.OPENAI_API_KEY = "sk-mock-key-for-development";
    console.warn(
      "⚠️ Using mock OpenAI API key. Some AI features will not work."
    );
  }

  if (
    !process.env.TAVILY_API_KEY ||
    process.env.TAVILY_API_KEY === "your_tavily_api_key"
  ) {
    process.env.TAVILY_API_KEY = "tavily-mock-key-for-development";
    console.warn(
      "⚠️ Using mock Tavily API key. Search features will not work."
    );
  }
}

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
      "https://mempool.space/api/v1/historical-price?currency=USD"
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching Bitcoin price history:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin price history" });
  }
});

// Bitcoin mempool fees endpoint
app.get("/api/bitcoin-fees", async (req, res) => {
  try {
    const response = await axios.get(
      "https://mempool.space/api/v1/fees/recommended"
    );

    res.status(200).json({
      fees: response.data,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error fetching Bitcoin mempool fees:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin mempool fees" });
  }
});

// Bitcoin mempool statistics endpoint
app.get("/api/mempool-stats", async (req, res) => {
  try {
    // Fetch detailed mempool statistics
    const statsResponse = await axios.get("https://mempool.space/api/mempool");
    // Fetch current blocks
    const blocksResponse = await axios.get(
      "https://mempool.space/api/blocks/tip/height"
    );

    res.status(200).json({
      mempool: statsResponse.data,
      currentBlockHeight: blocksResponse.data,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error fetching mempool statistics:", error);
    res.status(500).json({ error: "Failed to fetch mempool statistics" });
  }
});

// Bitcoin blockchain height endpoint
app.get("/api/blockchain-height", async (req, res) => {
  try {
    const response = await axios.get(
      "https://mempool.space/api/blocks/tip/height"
    );

    res.status(200).json({
      height: response.data,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error fetching blockchain height:", error);
    res.status(500).json({ error: "Failed to fetch blockchain height" });
  }
});

// Bitcoin transactions per second (TPS) endpoint
app.get("/api/bitcoin-tps", async (req, res) => {
  try {
    // Get recent blocks to calculate TPS
    const response = await axios.get("https://mempool.space/api/v1/blocks/5");
    const blocks = response.data;

    // Calculate total transactions and time span
    let totalTxs = 0;
    let oldestBlockTime = Infinity;
    let newestBlockTime = 0;

    blocks.forEach((block) => {
      totalTxs += block.tx_count;
      if (block.timestamp < oldestBlockTime) oldestBlockTime = block.timestamp;
      if (block.timestamp > newestBlockTime) newestBlockTime = block.timestamp;
    });

    // Calculate time span in seconds
    const timeSpanSeconds = newestBlockTime - oldestBlockTime;

    // Calculate TPS
    const tps = timeSpanSeconds > 0 ? totalTxs / timeSpanSeconds : 0;

    // Get current mempool backlog for pending TPS estimate
    const mempoolResponse = await axios.get(
      "https://mempool.space/api/mempool"
    );
    const pendingTxs = mempoolResponse.data.count;

    res.status(200).json({
      tps: parseFloat(tps.toFixed(3)),
      timeSpanSeconds,
      blocksAnalyzed: blocks.length,
      totalTransactions: totalTxs,
      pendingTransactions: pendingTxs,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error calculating Bitcoin TPS:", error);
    res.status(500).json({ error: "Failed to calculate Bitcoin TPS" });
  }
});

// Bitcoin market data endpoint (using Blockchain.com API + Mempool price)
app.get("/api/bitcoin-market-data", async (req, res) => {
  try {
    console.log("Fetching Bitcoin market data from Blockchain.com...");
    const startTime = Date.now();

    // Get blockchain stats from Blockchain.com API
    const blockchainResponse = await axios.get(
      "https://api.blockchain.info/stats",
      {
        timeout: 10000, // 10 second timeout
        headers: {
          Accept: "application/json",
        },
      }
    );

    // Get current Bitcoin price from mempool.space
    const priceResponse = await axios.get(
      "https://mempool.space/api/v1/prices",
      { timeout: 5000 }
    );

    const endTime = Date.now();
    console.log(`APIs responded in ${endTime - startTime}ms`);

    // Check if we have the expected data
    if (!blockchainResponse.data || !priceResponse.data) {
      console.error("Unexpected response format:", {
        blockchain: blockchainResponse.data,
        price: priceResponse.data,
      });
      throw new Error("Invalid response format from APIs");
    }

    // Extract data from responses
    const circulatingSupply = blockchainResponse.data.totalbc / 100000000; // Convert sats to BTC
    const priceUSD = priceResponse.data.USD;

    // Calculate market cap (price * circulating supply)
    const marketCap = priceUSD * circulatingSupply;

    // Get 24h volume from the stats (in USD)
    const volume24h = blockchainResponse.data.estimated_transaction_volume_usd;

    const marketData = {
      price: priceUSD,
      market_cap: marketCap,
      total_volume: volume24h,
      circulating_supply: circulatingSupply,
      max_supply: 21000000, // Bitcoin's fixed supply cap
      price_change_percentage_24h: 0, // Not available in this API
      price_change_percentage_7d: 0, // Not available in this API
      time: Math.floor(Date.now() / 1000),
    };

    console.log("Bitcoin market data successfully fetched");
    res.status(200).json(marketData);
  } catch (error) {
    console.error("Error fetching Bitcoin market data:", error);

    // Provide more detailed error information
    const errorDetails = {
      error: "Failed to fetch Bitcoin market data",
      message: error.message,
      code: error.code || "UNKNOWN",
    };

    if (error.response) {
      errorDetails.statusCode = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    }

    console.error("Detailed error:", JSON.stringify(errorDetails, null, 2));

    // Provide fallback data
    const fallbackData = {
      price: 65000,
      market_cap: 1350000000000,
      total_volume: 25000000000,
      circulating_supply: 19500000,
      max_supply: 21000000,
      price_change_percentage_24h: 0,
      price_change_percentage_7d: 0,
      time: Math.floor(Date.now() / 1000),
      isFallback: true,
    };

    // Send fallback data with a 200 status but include error info
    res.status(200).json({
      ...fallbackData,
      _error: "Using fallback data due to API issues",
    });
  }
});

// Bitcoin circulating supply endpoint (using Blockchain.com API)
app.get("/api/bitcoin-supply", async (req, res) => {
  try {
    console.log("Fetching Bitcoin supply data from Blockchain.com...");
    const startTime = Date.now();

    const response = await axios.get("https://api.blockchain.info/stats", {
      timeout: 10000, // 10 second timeout
      headers: {
        Accept: "application/json",
      },
    });

    const endTime = Date.now();
    console.log(`Blockchain.com API responded in ${endTime - startTime}ms`);

    // Check if we have the expected data
    if (!response.data || !response.data.totalbc) {
      console.error(
        "Unexpected response format from Blockchain.com:",
        response.data
      );
      throw new Error("Invalid response format from Blockchain.com API");
    }

    // Convert satoshis to BTC
    const circulatingSupply = response.data.totalbc / 100000000;

    // Bitcoin's max supply is fixed at 21 million
    const maxSupply = 21000000;

    const supplyData = {
      circulating_supply: circulatingSupply,
      max_supply: maxSupply,
      percent_mined: ((circulatingSupply / maxSupply) * 100).toFixed(2),
      time: Math.floor(Date.now() / 1000),
    };

    console.log("Bitcoin supply data successfully fetched");
    res.status(200).json(supplyData);
  } catch (error) {
    console.error("Error fetching Bitcoin supply data:", error);

    // Provide more detailed error information
    const errorDetails = {
      error: "Failed to fetch Bitcoin supply data",
      message: error.message,
      code: error.code || "UNKNOWN",
    };

    if (error.response) {
      errorDetails.statusCode = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    }

    console.error("Detailed error:", JSON.stringify(errorDetails, null, 2));

    // Provide fallback data
    const fallbackData = {
      circulating_supply: 19500000,
      max_supply: 21000000,
      percent_mined: 92.85,
      time: Math.floor(Date.now() / 1000),
      isFallback: true,
    };

    // Send fallback data with a 200 status but include error info
    res.status(200).json({
      ...fallbackData,
      _error: "Using fallback data due to API issues",
    });
  }
});

// Bitcoin halving countdown endpoint
app.get("/api/bitcoin-halving", async (req, res) => {
  try {
    // Get current block height
    const heightResponse = await axios.get(
      "https://mempool.space/api/blocks/tip/height"
    );
    const currentHeight = parseInt(heightResponse.data);

    // Calculate next halving block
    // Halvings occur every 210,000 blocks
    const halvingInterval = 210000;
    const nextHalvingBlock =
      Math.ceil(currentHeight / halvingInterval) * halvingInterval;

    // Calculate blocks remaining
    const blocksRemaining = nextHalvingBlock - currentHeight;

    // Estimate time remaining based on 10-minute average block time
    const minutesPerBlock = 10;
    const minutesRemaining = blocksRemaining * minutesPerBlock;
    const daysRemaining = (minutesRemaining / (60 * 24)).toFixed(2);

    // Calculate estimated date of halving
    const halvingDate = new Date();
    halvingDate.setMinutes(halvingDate.getMinutes() + minutesRemaining);

    // Current halving epoch (0-indexed)
    const currentEpoch = Math.floor(currentHeight / halvingInterval);

    // Calculate reward after halving
    const initialReward = 50; // Initial reward in BTC
    const nextReward = initialReward / Math.pow(2, currentEpoch + 1);

    res.status(200).json({
      currentHeight,
      nextHalvingBlock,
      blocksRemaining,
      estimatedDaysRemaining: parseFloat(daysRemaining),
      estimatedHalvingDate: halvingDate.toISOString(),
      currentReward: initialReward / Math.pow(2, currentEpoch),
      nextReward,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error calculating halving countdown:", error);
    res.status(500).json({ error: "Failed to calculate halving countdown" });
  }
});

// Bitcoin Fear and Greed Index endpoint
app.get("/api/fear-greed-index", async (req, res) => {
  try {
    const response = await axios.get("https://api.alternative.me/fng/");

    const fearGreedData = {
      value: parseInt(response.data.data[0].value),
      valueClassification: response.data.data[0].value_classification,
      timestamp: parseInt(response.data.data[0].timestamp),
      timeUntilUpdate: response.data.data[0].time_until_update,
      time: Math.floor(Date.now() / 1000),
    };

    res.status(200).json(fearGreedData);
  } catch (error) {
    console.error("Error fetching Fear and Greed Index:", error);
    res.status(500).json({ error: "Failed to fetch Fear and Greed Index" });
  }
});

// Bitcoin Funding Rate endpoint
app.get("/api/funding-rate", async (req, res) => {
  try {
    // Use Kraken Futures API for funding rates - US accessible
    const response = await axios.get(
      "https://futures.kraken.com/derivatives/api/v3/tickers"
    );

    if (!response.data || !response.data.tickers) {
      throw new Error("Unexpected response format from Kraken API");
    }

    // Find the BTC/USD perpetual contract
    const btcPerpetual = response.data.tickers.find(
      (ticker) => ticker.symbol === "PI_XBTUSD" // Kraken's symbol for BTC/USD perpetual
    );

    if (!btcPerpetual) {
      throw new Error(
        "Could not find BTC/USD perpetual data in Kraken response"
      );
    }

    // Get the current funding rate
    const currentRate = parseFloat(btcPerpetual.fundingRate || 0);

    // Also get the predicted next funding rate if available
    const predictedRate = parseFloat(btcPerpetual.fundingRatePrediction || 0);

    // Determine sentiment based on the current funding rate
    let sentiment;
    if (currentRate > 0.0001) sentiment = "Strongly Bullish";
    else if (currentRate > 0) sentiment = "Bullish";
    else if (currentRate > -0.0001) sentiment = "Neutral";
    else if (currentRate > -0.0005) sentiment = "Bearish";
    else sentiment = "Strongly Bearish";

    // Format the response
    res.status(200).json({
      currentRate: currentRate,
      predictedRate: predictedRate,
      sentiment: sentiment,
      markPrice: parseFloat(btcPerpetual.markPrice || 0),
      lastTradedPrice: parseFloat(btcPerpetual.last || 0),
      source: "Kraken Futures",
      symbol: "PI_XBTUSD (BTC/USD Perpetual)",
      explanation:
        "Positive rates typically mean the market is bullish (longs pay shorts), negative rates typically mean the market is bearish (shorts pay longs).",
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error fetching funding rate data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data));
    }

    res.status(500).json({
      error: "Failed to fetch funding rate data",
      message: error.message,
      note: "If you continue to experience issues, consider using CoinGecko price change data as a proxy for market sentiment.",
    });
  }
});

// Lightning Network Statistics endpoint
app.get("/api/lightning-stats", async (req, res) => {
  try {
    // Get Lightning Network statistics from mempool.space
    const response = await axios.get(
      "https://mempool.space/api/v1/lightning/statistics/latest"
    );

    if (!response.data) {
      throw new Error(
        "Unexpected response format from mempool.space Lightning API"
      );
    }

    // Format the data for our response
    const lightningStats = {
      nodeCount: response.data.latest.node_count,
      channelCount: response.data.latest.channel_count,
      totalCapacity: {
        btc: response.data.latest.total_capacity / 100000000, // Convert sats to BTC
        sats: response.data.latest.total_capacity,
      },
      avgChannelSize: {
        btc:
          response.data.latest.total_capacity /
          response.data.latest.channel_count /
          100000000,
        sats:
          response.data.latest.total_capacity /
          response.data.latest.channel_count,
      },
      medianChannelSize: {
        btc: response.data.latest.median_channel_size_sat / 100000000,
        sats: response.data.latest.median_channel_size_sat,
      },
      avgChannelsPerNode: response.data.latest.avg_channels_per_node,
      avgNodeCapacity: {
        btc:
          response.data.latest.total_capacity /
          response.data.latest.node_count /
          100000000,
        sats:
          response.data.latest.total_capacity / response.data.latest.node_count,
      },
      source: "mempool.space",
      time: Math.floor(Date.now() / 1000),
    };

    res.status(200).json(lightningStats);
  } catch (error) {
    console.error(
      "Error fetching Lightning Network statistics:",
      error.message
    );
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data));
    }

    res.status(500).json({
      error: "Failed to fetch Lightning Network statistics",
      message: error.message,
    });
  }
});

// Bitcoin News Aggregator endpoint
app.get("/api/bitcoin-news", async (req, res) => {
  try {
    const news = [];

    // Fetch from CoinDesk RSS feed
    const coindeskResponse = await axios.get(
      "https://www.coindesk.com/arc/outboundfeeds/rss/"
    );

    // Simple XML parsing to extract articles - in production you'd use a proper XML/RSS parser
    const xmlString = coindeskResponse.data;

    // Extract items between <item> tags
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let coindeskCount = 0;

    while ((match = itemRegex.exec(xmlString)) !== null && coindeskCount < 15) {
      const itemContent = match[1];

      // Extract title
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(
        itemContent
      );
      const title = titleMatch ? titleMatch[1] : "";

      // Skip if not Bitcoin related
      if (
        !title.toLowerCase().includes("bitcoin") &&
        !title.toLowerCase().includes("btc")
      ) {
        continue;
      }

      // Extract link
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
      const link = linkMatch ? linkMatch[1] : "";

      // Extract publication date
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
      const pubDate = pubDateMatch ? pubDateMatch[1] : "";

      // Extract description
      const descMatch =
        /<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(itemContent);
      const description = descMatch ? descMatch[1] : "";

      if (title && link) {
        news.push({
          title,
          url: link,
          description:
            description.substring(0, 200) +
            (description.length > 200 ? "..." : ""),
          publishedAt: pubDate,
          source: "CoinDesk",
        });
        coindeskCount++;
      }
    }

    // If no news was fetched
    if (news.length === 0) {
      throw new Error("No Bitcoin-related news found in CoinDesk RSS feed");
    }

    // Sort by date (newest first)
    news.sort((a, b) => {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    res.status(200).json({
      news,
      source: "CoinDesk RSS",
      count: news.length,
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Error fetching Bitcoin news:", error.message);
    res.status(500).json({
      error: "Failed to fetch Bitcoin news",
      message: error.message,
    });
  }
});

// AI Agent workflow endpoint - Using LangGraph implementation
app.post("/api/ai/workflow", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Use the LangGraph workflow implementation
    const result = await runWorkflow(input);

    res.status(200).json(result);
  } catch (error) {
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

// Execution trace endpoint - Using LangGraph implementation
app.post("/api/ai/trace", async (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: "State object is required" });
    }

    // Use the execution trace generator
    const trace = getExecutionTrace(state);

    res.status(200).json({ trace });
  } catch (error) {
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
