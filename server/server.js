import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

// Bitcoin market cap endpoint (using CoinGecko API)
app.get("/api/bitcoin-market-data", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
    );

    const marketData = {
      price: response.data.market_data.current_price.usd,
      market_cap: response.data.market_data.market_cap.usd,
      total_volume: response.data.market_data.total_volume.usd,
      circulating_supply: response.data.market_data.circulating_supply,
      max_supply: response.data.market_data.max_supply,
      ath: response.data.market_data.ath.usd,
      ath_date: response.data.market_data.ath_date.usd,
      price_change_percentage_24h:
        response.data.market_data.price_change_percentage_24h,
      price_change_percentage_7d:
        response.data.market_data.price_change_percentage_7d,
      price_change_percentage_30d:
        response.data.market_data.price_change_percentage_30d,
      time: Math.floor(Date.now() / 1000),
    };

    res.status(200).json(marketData);
  } catch (error) {
    console.error("Error fetching Bitcoin market data:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin market data" });
  }
});

// Bitcoin circulating supply endpoint
app.get("/api/bitcoin-supply", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
    );

    const supplyData = {
      circulating_supply: response.data.market_data.circulating_supply,
      max_supply: response.data.market_data.max_supply,
      percent_mined: (
        (response.data.market_data.circulating_supply /
          response.data.market_data.max_supply) *
        100
      ).toFixed(2),
      time: Math.floor(Date.now() / 1000),
    };

    res.status(200).json(supplyData);
  } catch (error) {
    console.error("Error fetching Bitcoin supply data:", error);
    res.status(500).json({ error: "Failed to fetch Bitcoin supply data" });
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
