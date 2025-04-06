import axios from "axios";
import { getCachedData, setCachedData, isCacheValid } from "../utils/apiCache";

// Define base URL for API calls
const API_BASE_URL = "http://localhost:3002";

// Define cache keys
const CACHE_KEYS = {
  BITCOIN_PRICE: "bitcoin_price",
  BITCOIN_MARKET_DATA: "bitcoin_market_data",
  BITCOIN_SUPPLY: "bitcoin_supply",
  BLOCKCHAIN_HEIGHT: "blockchain_height",
  BITCOIN_FEES: "bitcoin_fees",
  BITCOIN_TPS: "bitcoin_tps",
  BITCOIN_HALVING: "bitcoin_halving",
  LIGHTNING_STATS: "lightning_stats",
  FEAR_GREED_INDEX: "FEAR_GREED_INDEX",
  FUNDING_RATE: "FUNDING_RATE",
  MEMPOOL_STATS: "MEMPOOL_STATS",
  BITCOIN_NEWS: "BITCOIN_NEWS",
  BITCOIN_HISTORY: "bitcoin_history",
};

// Define response types
interface BitcoinPriceResponse {
  time: number;
  price: number;
}

interface BitcoinMarketDataResponse {
  time: number;
  price: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  max_supply: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  _error?: string;
  isFallback?: boolean;
}

interface BitcoinSupplyResponse {
  time: number;
  circulating_supply: number;
  max_supply: number;
  percent_mined: number;
  _error?: string;
  isFallback?: boolean;
}

interface BlockchainHeightResponse {
  time: number;
  height: number;
}

interface BitcoinFeesResponse {
  fees: {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
  };
  time: number;
}

interface BitcoinTPSResponse {
  tps: number;
  timeSpanSeconds: number;
  blocksAnalyzed: number;
  totalTransactions: number;
  pendingTransactions: number;
  time: number;
}

interface BitcoinHalvingResponse {
  currentHeight: number;
  nextHalvingBlock: number;
  blocksRemaining: number;
  estimatedDaysRemaining: number;
  estimatedHalvingDate: string;
  currentReward: number;
  nextReward: number;
  time: number;
}

interface LightningStatsResponse {
  nodeCount: number;
  channelCount: number;
  totalCapacity: {
    btc: number;
    sats: number;
  };
  avgChannelSize: {
    btc: number;
    sats: number;
  };
  medianChannelSize: {
    btc: number;
    sats: number;
  };
  avgChannelsPerNode: number;
  avgNodeCapacity: {
    btc: number;
    sats: number;
  };
  source: string;
  time: number;
}

interface ApiError {
  error: string;
  message?: string;
}

// Add fallback data constants at the top
// Define fallback data for when API fails and no cache is available
const FALLBACK_DATA = {
  MARKET_DATA: {
    marketCap: 1390000000000, // 1.39 trillion
    formattedMarketCap: "$1.39T",
    volume24h: 24500000000, // 24.5 billion
    formattedVolume: "$24.5B",
    circulatingSupply: 19500000, // 19.5 million
    maxSupply: 21000000,
    priceChange24h: 0,
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  SUPPLY_DATA: {
    circulatingSupply: 19500000, // 19.5 million
    formattedCirculatingSupply: "19.50M BTC",
    maxSupply: 21000000,
    percentMined: 92.85, // 19.5/21 * 100
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  FEES_DATA: {
    fastestFee: 25,
    halfHourFee: 15,
    hourFee: 10,
    economyFee: 5,
    minimumFee: 2,
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  TPS_DATA: {
    tps: 5.2,
    timeSpanSeconds: 1800, // 30 minutes
    blocksAnalyzed: 6,
    totalTransactions: 18720,
    pendingTransactions: 3500,
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  HALVING_DATA: {
    currentHeight: 840000,
    nextHalvingBlock: 1050000,
    blocksRemaining: 210000,
    estimatedDaysRemaining: 1458.33,
    estimatedHalvingDate: new Date("2028-04-20T00:00:00"),
    currentReward: 3.125,
    nextReward: 1.5625,
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  LIGHTNING_STATS: {
    nodeCount: 15600,
    channelCount: 112000,
    totalCapacity: {
      btc: 4600,
      sats: 460000000000,
    },
    avgChannelSize: {
      btc: 0.041,
      sats: 4100000,
    },
    medianChannelSize: {
      btc: 0.021,
      sats: 2100000,
    },
    avgChannelsPerNode: 7.2,
    avgNodeCapacity: {
      btc: 0.295,
      sats: 29500000,
    },
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  FEAR_GREED_INDEX: {
    value: 50,
    valueClassification: "Neutral",
    timestamp: Math.floor(Date.now() / 1000),
    timeUntilUpdate: 86400, // 24 hours in seconds
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  FUNDING_RATE: {
    currentRate: 0,
    predictedRate: 0,
    sentiment: "Neutral",
    markPrice: 0,
    lastTradedPrice: 0,
    source: "Fallback Data",
    symbol: "BTC/USD",
    explanation:
      "Positive rates typically mean the market is bullish (longs pay shorts), negative rates typically mean the market is bearish (shorts pay longs).",
    exchangeCount: 0,
    exchanges: {
      kraken: null,
      binance: null,
      bybit: null,
      okx: null,
    },
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  MEMPOOL_STATS: {
    count: 1500, // ~1500 transactions in mempool
    vsize: 1500000, // 1.5MB of pending transactions
    totalFee: 1000000, // 1 million sats in fees
    feeHistogram: [
      [10, 100000] as [number, number], // High priority, small size
      [5, 200000] as [number, number], // Medium priority, medium size
      [1, 1200000] as [number, number], // Low priority, large size
    ],
    currentBlockHeight: 840000,
    lastUpdated: new Date(),
    fromCache: false,
    isFallback: true,
  },
  BITCOIN_NEWS: {
    news: [
      {
        title: "Bitcoin Adoption Continues to Grow Globally",
        url: "https://example.com/bitcoin-adoption",
        description:
          "More countries and institutions are exploring Bitcoin as both a store of value and a payment system...",
        publishedAt: new Date().toISOString(),
        source: "Offline Cache",
        sentiment: "positive" as "positive",
      },
      {
        title: "Bitcoin Mining Difficulty Reaches New All-Time High",
        url: "https://example.com/mining-difficulty",
        description:
          "The Bitcoin network has adjusted its mining difficulty upward, reflecting increased hash power...",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: "Offline Cache",
        sentiment: "neutral" as "neutral",
      },
      {
        title: "Bitcoin Conference Announces Record Attendance for 2025",
        url: "https://example.com/bitcoin-conference",
        description:
          "The annual Bitcoin conference is expected to draw record crowds as interest in cryptocurrency grows...",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: "Offline Cache",
        sentiment: "positive" as "positive",
      },
    ],
    source: "Fallback Data",
    count: 3,
    fromCache: false,
    isFallback: true,
    lastUpdated: new Date(),
  },
};

// Bitcoin price API
export const fetchBitcoinPrice = async (
  forceRefresh = false
): Promise<{
  price: number;
  formattedPrice: string;
  lastUpdated: Date;
  fromCache?: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (15 second TTL for price data)
    const CACHE_TTL = 15000; // 15 seconds
    const cacheKey = CACHE_KEYS.BITCOIN_PRICE;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin price data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    const response = await axios.get<BitcoinPriceResponse>(
      `${API_BASE_URL}/api/bitcoin-price`
    );

    // Transform data for component consumption
    const transformedData = {
      price: response.data.price,
      formattedPrice: `$${response.data.price.toLocaleString()}`,
      lastUpdated: new Date(response.data.time * 1000),
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin price data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_PRICE;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log(
        "Returning cached Bitcoin price data after error",
        cachedData
      );
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    // If no cache, provide a reasonable fallback (Bitcoin price ~60K USD)
    console.log("No cache available, returning fallback Bitcoin price");
    return {
      price: 60000,
      formattedPrice: "$60,000",
      lastUpdated: new Date(),
      isFallback: true,
    };
  }
};

// Bitcoin market data API
export const fetchBitcoinMarketData = async (
  forceRefresh = false
): Promise<{
  marketCap: number;
  formattedMarketCap: string;
  volume24h: number;
  formattedVolume: string;
  circulatingSupply: number;
  maxSupply: number;
  priceChange24h: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (30 second TTL for market data)
    const CACHE_TTL = 30000; // 30 seconds
    const cacheKey = CACHE_KEYS.BITCOIN_MARKET_DATA;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached market data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    // Fetch fresh data from API
    const response = await axios.get<BitcoinMarketDataResponse>(
      `${API_BASE_URL}/api/bitcoin-market-data`
    );

    // Transform data for component consumption
    const transformedData = {
      marketCap: response.data.market_cap,
      formattedMarketCap: `$${(response.data.market_cap / 1e9).toFixed(2)}B`,
      volume24h: response.data.total_volume || 0,
      formattedVolume: `$${((response.data.total_volume || 0) / 1e9).toFixed(
        2
      )}B`,
      circulatingSupply: response.data.circulating_supply,
      maxSupply: response.data.max_supply,
      priceChange24h: response.data.price_change_percentage_24h || 0,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh market data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin market data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_MARKET_DATA;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached market data after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback market data");
    return { ...FALLBACK_DATA.MARKET_DATA };

    // The code below will never be reached with fallback data, but leaving it for completeness
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.response?.status === 500) {
        throw new Error(
          "Server error. The CoinGecko API may be temporarily unavailable."
        );
      } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new Error("Request timed out. Please check your connection.");
      }
    }

    throw error;
  }
};

// Bitcoin supply API
export const fetchBitcoinSupply = async (
  forceRefresh = false
): Promise<{
  circulatingSupply: number;
  formattedCirculatingSupply: string;
  maxSupply: number;
  percentMined: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (1 minute TTL for supply data)
    const CACHE_TTL = 60000; // 1 minute
    const cacheKey = CACHE_KEYS.BITCOIN_SUPPLY;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached supply data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    // Fetch fresh data from API
    const response = await axios.get<BitcoinSupplyResponse>(
      `${API_BASE_URL}/api/bitcoin-supply`
    );

    // Format circulating supply to show in millions with 2 decimal places
    const supplyInMillions = response.data.circulating_supply / 1000000;

    // Transform data for component consumption
    const transformedData = {
      circulatingSupply: response.data.circulating_supply,
      formattedCirculatingSupply: `${supplyInMillions.toFixed(2)}M BTC`,
      maxSupply: response.data.max_supply,
      percentMined: response.data.percent_mined,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh supply data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin supply data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_SUPPLY;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached supply data after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback supply data");
    return { ...FALLBACK_DATA.SUPPLY_DATA };

    // The code below will never be reached with fallback data, but leaving it for completeness
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.response?.status === 500) {
        throw new Error(
          "Server error. The CoinGecko API may be temporarily unavailable."
        );
      } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new Error("Request timed out. Please check your connection.");
      }
    }

    throw error;
  }
};

// Blockchain height API
export const fetchBlockchainHeight = async (
  forceRefresh = false
): Promise<{
  height: number;
  formattedHeight: string;
  lastUpdated: Date;
  fromCache: boolean;
}> => {
  try {
    // Check cache first (20 seconds TTL for blockchain height)
    const CACHE_TTL = 20000; // 20 seconds
    const cacheKey = CACHE_KEYS.BLOCKCHAIN_HEIGHT;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    // Fetch fresh data from API
    const response = await axios.get<BlockchainHeightResponse>(
      `${API_BASE_URL}/api/blockchain-height`
    );

    // Transform data for component consumption
    const transformedData = {
      height: response.data.height,
      formattedHeight: response.data.height.toLocaleString(),
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching blockchain height:", error);

    // If we have cached data, return it even if expired during an error
    const cachedData = getCachedData<any>(
      CACHE_KEYS.BLOCKCHAIN_HEIGHT,
      Infinity
    );
    if (cachedData) {
      return {
        ...cachedData,
        fromCache: true,
      };
    }

    throw error;
  }
};

// Bitcoin fees API
export const fetchBitcoinFees = async (
  forceRefresh = false
): Promise<{
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (30 second TTL for fees data)
    const CACHE_TTL = 30000; // 30 seconds
    const cacheKey = CACHE_KEYS.BITCOIN_FEES;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin fees data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Bitcoin fees data");
    const response = await axios.get<BitcoinFeesResponse>(
      `${API_BASE_URL}/api/bitcoin-fees`
    );

    // Transform data for component consumption
    const transformedData = {
      fastestFee: response.data.fees.fastestFee,
      halfHourFee: response.data.fees.halfHourFee,
      hourFee: response.data.fees.hourFee,
      economyFee: response.data.fees.economyFee,
      minimumFee: response.data.fees.minimumFee,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin fees data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin fees data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_FEES;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached Bitcoin fees data after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback Bitcoin fees data");
    return { ...FALLBACK_DATA.FEES_DATA };
  }
};

// Bitcoin TPS API
export const fetchBitcoinTPS = async (
  forceRefresh = false
): Promise<{
  tps: number;
  timeSpanSeconds: number;
  blocksAnalyzed: number;
  totalTransactions: number;
  pendingTransactions: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (60 second TTL for TPS data)
    const CACHE_TTL = 60000; // 60 seconds
    const cacheKey = CACHE_KEYS.BITCOIN_TPS;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin TPS data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Bitcoin TPS data");
    const response = await axios.get<BitcoinTPSResponse>(
      `${API_BASE_URL}/api/bitcoin-tps`
    );

    // Transform data for component consumption
    const transformedData = {
      tps: response.data.tps,
      timeSpanSeconds: response.data.timeSpanSeconds,
      blocksAnalyzed: response.data.blocksAnalyzed,
      totalTransactions: response.data.totalTransactions,
      pendingTransactions: response.data.pendingTransactions,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin TPS data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin TPS data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_TPS;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached Bitcoin TPS data after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback Bitcoin TPS data");
    return { ...FALLBACK_DATA.TPS_DATA };
  }
};

// Bitcoin Halving API
export const fetchBitcoinHalving = async (
  forceRefresh = false
): Promise<{
  currentHeight: number;
  nextHalvingBlock: number;
  blocksRemaining: number;
  estimatedDaysRemaining: number;
  estimatedHalvingDate: Date;
  currentReward: number;
  nextReward: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (5 minute TTL for halving data - it doesn't change quickly)
    const CACHE_TTL = 300000; // 5 minutes
    const cacheKey = CACHE_KEYS.BITCOIN_HALVING;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin halving data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Bitcoin halving data");
    const response = await axios.get<BitcoinHalvingResponse>(
      `${API_BASE_URL}/api/bitcoin-halving`
    );

    // Transform data for component consumption
    const transformedData = {
      currentHeight: response.data.currentHeight,
      nextHalvingBlock: response.data.nextHalvingBlock,
      blocksRemaining: response.data.blocksRemaining,
      estimatedDaysRemaining: response.data.estimatedDaysRemaining,
      estimatedHalvingDate: new Date(response.data.estimatedHalvingDate),
      currentReward: response.data.currentReward,
      nextReward: response.data.nextReward,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin halving data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin halving data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_HALVING;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log(
        "Returning cached Bitcoin halving data after error",
        cachedData
      );
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback Bitcoin halving data");
    return { ...FALLBACK_DATA.HALVING_DATA };
  }
};

// Lightning stats API
export const fetchLightningStats = async (
  forceRefresh = false
): Promise<{
  nodeCount: number;
  channelCount: number;
  totalCapacity: {
    btc: number;
    sats: number;
  };
  avgChannelSize: {
    btc: number;
    sats: number;
  };
  medianChannelSize: {
    btc: number;
    sats: number;
  };
  avgChannelsPerNode: number;
  avgNodeCapacity: {
    btc: number;
    sats: number;
  };
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (10 minute TTL for Lightning stats - they don't change rapidly)
    const CACHE_TTL = 600000; // 10 minutes
    const cacheKey = CACHE_KEYS.LIGHTNING_STATS;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Lightning Network stats", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Lightning Network stats");
    const response = await axios.get<LightningStatsResponse>(
      `${API_BASE_URL}/api/lightning-stats`
    );

    // Calculate avgChannelsPerNode if not provided by API
    const avgChannelsPerNode =
      response.data.avgChannelsPerNode ||
      (response.data.nodeCount && response.data.channelCount
        ? response.data.channelCount / response.data.nodeCount
        : 0);

    // Transform data for component consumption
    const transformedData = {
      nodeCount: response.data.nodeCount,
      channelCount: response.data.channelCount,
      totalCapacity: response.data.totalCapacity,
      avgChannelSize: response.data.avgChannelSize,
      medianChannelSize: response.data.medianChannelSize,
      avgChannelsPerNode: avgChannelsPerNode,
      avgNodeCapacity: response.data.avgNodeCapacity,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Lightning Network stats", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Lightning Network stats:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.LIGHTNING_STATS;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log(
        "Returning cached Lightning Network stats after error",
        cachedData
      );
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log(
      "No cache available, returning fallback Lightning Network stats"
    );
    return { ...FALLBACK_DATA.LIGHTNING_STATS };
  }
};

// Health check API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data.status === "ok";
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};

// Interface for Fear and Greed Index API response
interface FearGreedIndexResponse {
  value: number;
  valueClassification: string;
  timestamp: number;
  timeUntilUpdate: number;
  time: number;
}

// Fear and Greed Index API
export const fetchFearGreedIndex = async (
  forceRefresh = false
): Promise<{
  value: number;
  valueClassification: string;
  timestamp: number;
  timeUntilUpdate: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (5 minute TTL for Fear & Greed Index)
    const CACHE_TTL = 300000; // 5 minutes
    const cacheKey = CACHE_KEYS.FEAR_GREED_INDEX;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Fear & Greed Index", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Fear & Greed Index");
    const response = await axios.get<FearGreedIndexResponse>(
      `${API_BASE_URL}/api/fear-greed-index`
    );

    // Transform data for component consumption
    const transformedData = {
      value: response.data.value,
      valueClassification: response.data.valueClassification,
      timestamp: response.data.timestamp,
      timeUntilUpdate: response.data.timeUntilUpdate,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Fear & Greed Index", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.FEAR_GREED_INDEX;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log(
        "Returning cached Fear & Greed Index after error",
        cachedData
      );
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback Fear & Greed Index");
    return { ...FALLBACK_DATA.FEAR_GREED_INDEX };
  }
};

// Interface for Funding Rate API response
interface FundingRateResponse {
  currentRate: number;
  predictedRate: number;
  sentiment: string;
  markPrice: number;
  lastTradedPrice: number;
  source: string;
  symbol: string;
  explanation: string;
  exchangeCount: number;
  exchanges: {
    kraken: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    binance: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    bybit: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    okx: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
  };
  time: number;
}

// Funding Rate API
export const fetchFundingRate = async (
  forceRefresh = false
): Promise<{
  currentRate: number;
  predictedRate: number;
  sentiment: string;
  markPrice: number;
  lastTradedPrice: number;
  source: string;
  symbol: string;
  explanation: string;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
  exchangeCount: number;
  exchanges?: {
    kraken: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    binance: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    bybit: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
    okx: {
      currentRate: number;
      predictedRate: number;
      markPrice: number;
      lastTradedPrice: number;
      symbol: string;
      interval: string;
    } | null;
  };
}> => {
  try {
    // Check cache first (3 minute TTL for funding rates - they can change quickly)
    const CACHE_TTL = 180000; // 3 minutes
    const cacheKey = CACHE_KEYS.FUNDING_RATE;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached funding rate data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh funding rate data");
    const response = await axios.get<FundingRateResponse>(
      `${API_BASE_URL}/api/funding-rate`
    );

    // Transform data for component consumption
    const transformedData = {
      currentRate: response.data.currentRate,
      predictedRate: response.data.predictedRate,
      sentiment: response.data.sentiment,
      markPrice: response.data.markPrice,
      lastTradedPrice: response.data.lastTradedPrice,
      source: response.data.source,
      symbol: response.data.symbol,
      explanation: response.data.explanation,
      exchanges: response.data.exchanges,
      exchangeCount: response.data.exchangeCount,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh funding rate data", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching funding rate data:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.FUNDING_RATE;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached funding rate data after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback funding rate data");
    return { ...FALLBACK_DATA.FUNDING_RATE };
  }
};

// Interface for Mempool Stats API response
interface MempoolStatsResponse {
  mempool: {
    count: number;
    vsize: number;
    total_fee: number;
    fee_histogram: [number, number][];
  };
  currentBlockHeight: number;
  time: number;
}

// Mempool Statistics API
export const fetchMempoolStats = async (
  forceRefresh = false
): Promise<{
  count: number;
  vsize: number;
  totalFee: number;
  feeHistogram: [number, number][];
  currentBlockHeight: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (30 second TTL for mempool stats - they change rapidly)
    const CACHE_TTL = 30000; // 30 seconds
    const cacheKey = CACHE_KEYS.MEMPOOL_STATS;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached mempool stats", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh mempool stats");
    const response = await axios.get<MempoolStatsResponse>(
      `${API_BASE_URL}/api/mempool-stats`
    );

    // Transform data for component consumption
    const transformedData = {
      count: response.data.mempool.count,
      vsize: response.data.mempool.vsize,
      totalFee: response.data.mempool.total_fee,
      feeHistogram: response.data.mempool.fee_histogram,
      currentBlockHeight: response.data.currentBlockHeight,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh mempool stats", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching mempool stats:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.MEMPOOL_STATS;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached mempool stats after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback mempool stats");
    return { ...FALLBACK_DATA.MEMPOOL_STATS };
  }
};

// Interface for Bitcoin News API response
interface BitcoinNewsResponse {
  news: Array<{
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    source: string;
  }>;
  source: string;
  count: number;
  time: number;
}

// Bitcoin News API
export const fetchBitcoinNews = async (
  forceRefresh = false
): Promise<{
  news: Array<{
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    source: string;
    sentiment?: "positive" | "negative" | "neutral";
  }>;
  source: string;
  count: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (15 minute TTL for news - they don't change very frequently)
    const CACHE_TTL = 900000; // 15 minutes
    const cacheKey = CACHE_KEYS.BITCOIN_NEWS;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin news", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Bitcoin news");
    const response = await axios.get<BitcoinNewsResponse>(
      `${API_BASE_URL}/api/bitcoin-news`
    );

    // Perform naive sentiment analysis on news titles
    const processedNews = response.data.news.map((article) => {
      // Very basic sentiment analysis based on keywords
      let sentiment: "positive" | "negative" | "neutral" = "neutral";

      const title = article.title.toLowerCase();

      // Positive keywords
      const positiveTerms = [
        "surge",
        "rise",
        "gain",
        "bull",
        "upward",
        "grow",
        "increase",
        "high",
        "record",
        "rally",
        "positive",
        "adoption",
      ];
      // Negative keywords
      const negativeTerms = [
        "drop",
        "fall",
        "declin",
        "crash",
        "bear",
        "down",
        "decrease",
        "low",
        "concern",
        "warn",
        "risk",
        "ban",
        "regulat",
      ];

      // Count matching terms
      let positiveCount = 0;
      let negativeCount = 0;

      positiveTerms.forEach((term) => {
        if (title.includes(term)) positiveCount++;
      });

      negativeTerms.forEach((term) => {
        if (title.includes(term)) negativeCount++;
      });

      // Determine sentiment based on keyword count
      if (positiveCount > negativeCount) sentiment = "positive";
      else if (negativeCount > positiveCount) sentiment = "negative";

      // Return enhanced article with sentiment
      return {
        ...article,
        sentiment,
      };
    });

    // Transform data for component consumption
    const transformedData = {
      news: processedNews,
      source: response.data.source,
      count: response.data.count,
      lastUpdated: new Date(response.data.time * 1000),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin news", transformedData);
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin news:", error);

    // If we have cached data, return it even if expired during an error
    const cacheKey = CACHE_KEYS.BITCOIN_NEWS;
    const cachedData = getCachedData<any>(cacheKey, Infinity);

    if (cachedData) {
      console.log("Returning cached Bitcoin news after error", cachedData);
      return {
        ...cachedData,
        fromCache: true,
        lastUpdated: cachedData.lastUpdated || new Date(),
      };
    }

    console.log("No cache available, returning fallback Bitcoin news");
    return { ...FALLBACK_DATA.BITCOIN_NEWS };
  }
};

// Bitcoin history API
export const fetchBitcoinHistory = async (
  forceRefresh = false
): Promise<{
  data: Array<{
    time: number;
    USD: number;
  }>;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}> => {
  try {
    // Check cache first (5 minute TTL for historical data - it doesn't change frequently)
    const CACHE_TTL = 300000; // 5 minutes
    const cacheKey = CACHE_KEYS.BITCOIN_HISTORY;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TTL)) {
      const cachedData = getCachedData<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log("Using cached Bitcoin history data", cachedData);
        return {
          ...cachedData,
          fromCache: true,
        };
      }
    }

    console.log("Fetching fresh Bitcoin history data");
    const response = await axios.get(`${API_BASE_URL}/api/bitcoin-history`, {
      transformResponse: [
        (data) => {
          try {
            // First try parsing as JSON
            const parsed = JSON.parse(data);
            console.log(
              `Parsed Bitcoin history data: ${typeof parsed} with ${
                Array.isArray(parsed) ? parsed.length : 0
              } items`
            );
            return parsed;
          } catch (e) {
            console.error("Failed to parse Bitcoin history response:", e);
            // If parsing fails, return empty array
            return [];
          }
        },
      ],
    });

    // Ensure we received an array of data points
    let historyData = [];

    if (response.data && Array.isArray(response.data)) {
      console.log(`Received ${response.data.length} history data points`);
      historyData = response.data;
    } else if (response.data) {
      console.warn(
        "Unexpected bitcoin history data format, attempting to convert",
        typeof response.data
      );

      // Try to handle the data if it's not an array but contains values we need
      try {
        // If it's an object, try to convert it to an array
        if (
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        ) {
          // Check if data has a data property that's an array
          if (response.data.data && Array.isArray(response.data.data)) {
            historyData = response.data.data;
          }
        }
      } catch (e) {
        console.error("Failed to extract history data from response", e);
      }
    }

    // Filter out any invalid entries
    historyData = historyData.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        "time" in item &&
        "USD" in item &&
        !isNaN(item.time) &&
        !isNaN(item.USD)
    );

    console.log(`Filtered to ${historyData.length} valid data points`);

    // Transform data for component consumption
    const transformedData = {
      data: historyData,
      lastUpdated: new Date(),
      fromCache: false,
    };

    // Update cache with fresh data
    console.log("Caching fresh Bitcoin history data");
    setCachedData(cacheKey, transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error fetching Bitcoin history data:", error);
    throw error;
  }
};

// Fix error handling in the fetchVoltageWalletBalance function
export const fetchVoltageWalletBalance =
  async (): Promise<LightningWalletBalance | null> => {
    try {
      const response = await axios.get<LightningWalletBalance>(
        `${API_BASE_URL}/api/lightning/balance`
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching Lightning wallet balance:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.message) {
        console.error("Error message:", error.message);
      }
      return null;
    }
  };

// Fix error handling in other similar functions
export const fetchLightningInfo =
  async (): Promise<LightningNodeInfo | null> => {
    try {
      const response = await axios.get<LightningNodeInfo>(
        `${API_BASE_URL}/api/lightning/info`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching Lightning node info:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      } else if (error.message) {
        console.error("Error message:", error.message);
      }
      return null;
    }
  };

// Fix item parameter in array.map
const processData = (data: any[]): ProcessedDataItem[] => {
  return data.map((item: any) => ({
    id: item.id,
    value: item.value,
    timestamp: new Date(item.timestamp),
  }));
};
