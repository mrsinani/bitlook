/**
 * Lightning Wallet Service
 *
 * This service handles interactions with Lightning Network APIs.
 * Using Voltage testnet node for Lightning operations via our proxy server.
 */

import { toast } from "@/components/ui/use-toast";

// Types
export interface LightningTransaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  status: "complete" | "pending" | "failed";
  type: "incoming" | "outgoing";
  paymentRequest?: string;
}

export interface WalletData {
  balance: number;
  transactions: LightningTransaction[];
}

export interface InvoiceParams {
  amount: number;
  description?: string;
  expiresIn?: number; // seconds
}

export interface NodeInfo {
  alias: string;
  pubkey: string;
  isConnected: boolean;
  numChannels: number;
  numPeers: number;
}

export interface NetworkStats {
  networkCapacity: number; // BTC
  totalChannels: number;
  avgFeeRate: number; // parts per million
  nodeCount: number;
}

// API response interfaces
interface WalletBalanceResponse {
  total_balance: number;
  confirmed_balance: number;
  unconfirmed_balance: number;
}

interface LndInvoice {
  memo: string;
  r_preimage: string;
  r_hash: string;
  value: number;
  value_msat: number;
  settled: boolean;
  creation_date: number;
  settle_date: number;
  payment_request: string;
  expiry: number;
  state: "OPEN" | "SETTLED" | "CANCELED" | "ACCEPTED";
  amt_paid_sat: number;
}

interface InvoicesResponse {
  invoices: LndInvoice[];
  last_index_offset: string;
  first_index_offset: string;
}

interface LndPayment {
  payment_hash: string;
  value_sat: number;
  creation_date: number;
  payment_request: string;
  status: "SUCCEEDED" | "FAILED" | "IN_FLIGHT";
  fee_sat: number;
  creation_time_ns: string;
  htlcs: Array<{
    route: {
      total_time_lock: number;
      total_amt: number;
      hops: Array<{
        chan_id: string;
        chan_capacity: number;
        amt_to_forward: number;
        expiry: number;
        pub_key: string;
      }>;
    };
    attempt_time_ns: string;
    status: string;
    resolve_time_ns: string;
    failure?: {
      code: number;
      failure_source_index: number;
    };
  }>;
}

interface PaymentsResponse {
  payments: LndPayment[];
  first_index_offset: number;
  last_index_offset: number;
}

interface InvoiceResponse {
  payment_request: string;
  add_index: string;
  r_hash: string;
}

interface DecodeInvoiceResponse {
  destination: string;
  payment_hash: string;
  num_satoshis: number;
  timestamp: number;
  description: string;
  expiry: number;
}

interface NodeInfoResponse {
  alias: string;
  identity_pubkey: string;
  uris: string[];
  num_active_channels: number;
  num_peers: number;
  synced_to_chain: boolean;
  version: string;
}

// Proxy API configuration - this is our Express server that proxies requests to Voltage
const PROXY_API_URL = import.meta.env.PROD
  ? "/api/lightning" // In production, use relative URL
  : "http://localhost:3001/api/lightning"; // In development

const VOLTAGE_NODE_PUBKEY =
  "0392b289595ff0a73611afd4515af2fba83a551d442bc5ab80ea7f8bf7a533ac06";

// Check if the proxy server is running
const checkProxyServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(PROXY_API_URL.replace("/api/lightning", ""));
    return response.ok;
  } catch (error) {
    console.error("Proxy server check failed:", error);
    return false;
  }
};

// Helper function to make proxy API calls
const makeProxyCall = async <T>(
  endpoint: string,
  method = "GET",
  body?: Record<string, unknown>
): Promise<T> => {
  try {
    // Check if proxy server is running
    const isProxyRunning = await checkProxyServer();
    if (!isProxyRunning) {
      console.error(
        "Lightning proxy server is not running. Please start it with: cd server && npm start"
      );
      throw new Error("Lightning proxy server is not running");
    }

    const url = `${PROXY_API_URL}/${endpoint}`;
    console.log(`Making request to: ${url}`);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Proxy API call failed:", error);
    throw error;
  }
};

// Lightning Node service
export const lightningService = {
  // Get wallet balance
  getWalletBalance: async (): Promise<number> => {
    try {
      // First check if proxy server is running
      const isProxyRunning = await checkProxyServer();
      if (!isProxyRunning) {
        console.log("Lightning proxy not available, returning mock data");
        return 250000; // Mock data
      }

      const response = await makeProxyCall<WalletBalanceResponse>("balance");
      // Return confirmed balance in sats
      return response.confirmed_balance;
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      // Return mock data on any error
      return 250000;
    }
  },

  // Get transaction history
  getTransactions: async (): Promise<LightningTransaction[]> => {
    try {
      // First check if proxy server is running
      const isProxyRunning = await checkProxyServer();
      if (!isProxyRunning) {
        console.log("Lightning proxy not available, returning mock data");
        return getMockTransactions(); // Mock data
      }

      // Get invoices (incoming payments)
      const invoices = await makeProxyCall<InvoicesResponse>("invoices");

      // Get payments (outgoing payments)
      const payments = await makeProxyCall<PaymentsResponse>("payments");

      const transactions: LightningTransaction[] = [];

      // Process invoices
      if (invoices && invoices.invoices) {
        invoices.invoices.forEach((invoice) => {
          if (invoice.state === "SETTLED") {
            transactions.push({
              id: invoice.r_hash,
              amount: invoice.value,
              date: new Date(invoice.settle_date * 1000),
              description: invoice.memo || "Incoming payment",
              status: "complete",
              type: "incoming",
              paymentRequest: invoice.payment_request,
            });
          } else if (invoice.state === "OPEN") {
            transactions.push({
              id: invoice.r_hash,
              amount: invoice.value,
              date: new Date(invoice.creation_date * 1000),
              description: invoice.memo || "Pending invoice",
              status: "pending",
              type: "incoming",
              paymentRequest: invoice.payment_request,
            });
          }
        });
      }

      // Process payments
      if (payments && payments.payments) {
        payments.payments.forEach((payment) => {
          transactions.push({
            id: payment.payment_hash,
            amount: payment.value_sat,
            date: new Date(payment.creation_date * 1000),
            description: payment.payment_request
              ? "Outgoing payment"
              : "Sent payment",
            status: payment.status === "SUCCEEDED" ? "complete" : "failed",
            type: "outgoing",
            paymentRequest: payment.payment_request,
          });
        });
      }

      // Sort by date (newest first)
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Failed to get transactions:", error);
      // Return mock data on any error
      return getMockTransactions();
    }
  },

  // Fetch wallet data (balance and transactions)
  getWalletData: async (): Promise<WalletData> => {
    try {
      const [balance, transactions] = await Promise.all([
        lightningService.getWalletBalance(),
        lightningService.getTransactions(),
      ]);

      return {
        balance,
        transactions,
      };
    } catch (error) {
      console.error("Failed to get wallet data:", error);
      // Return mock data
      return {
        balance: 250000,
        transactions: getMockTransactions(),
      };
    }
  },

  // Create a new invoice
  createInvoice: async (params: InvoiceParams): Promise<string> => {
    try {
      const body = {
        value: params.amount,
        memo: params.description || "Lightning Invoice",
        expiry: params.expiresIn || 86400, // Default 24 hours
      };

      const response = await makeProxyCall<InvoiceResponse>(
        "invoice",
        "POST",
        body
      );

      if (!response.payment_request) {
        throw new Error("Invoice creation failed: No payment request returned");
      }

      return response.payment_request;
    } catch (error) {
      console.error("Failed to create invoice:", error);
      throw error;
    }
  },

  // Pay an invoice
  payInvoice: async (
    paymentRequest: string
  ): Promise<{ success: boolean; amount: number }> => {
    try {
      // First decode the invoice to get the amount
      const decodedInvoice = await lightningService.decodeInvoice(
        paymentRequest
      );

      // Then pay the invoice
      const body = {
        payment_request: paymentRequest,
        allow_self_payment: true, // For testnet to allow payments to your own invoices
      };

      await makeProxyCall("pay", "POST", body);

      return {
        success: true,
        amount: decodedInvoice.amount,
      };
    } catch (error) {
      console.error("Payment failed:", error);
      throw error;
    }
  },

  // Get node info
  getNodeInfo: async (): Promise<NodeInfo> => {
    try {
      const info = await makeProxyCall<NodeInfoResponse>("info");

      return {
        alias: info.alias,
        pubkey: info.identity_pubkey,
        isConnected: info.synced_to_chain,
        numChannels: info.num_active_channels,
        numPeers: info.num_peers,
      };
    } catch (error) {
      console.error("Failed to get node info:", error);
      return {
        alias: "BitlookNode",
        pubkey: VOLTAGE_NODE_PUBKEY,
        isConnected: true,
        numChannels: 0,
        numPeers: 0,
      };
    }
  },

  // Decode a BOLT11 invoice
  decodeInvoice: async (
    bolt11: string
  ): Promise<{ amount: number; description: string; timestamp: number }> => {
    try {
      const decoded = await makeProxyCall<DecodeInvoiceResponse>(
        `decode/${encodeURIComponent(bolt11)}`
      );

      return {
        amount: decoded.num_satoshis,
        description: decoded.description,
        timestamp: decoded.timestamp,
      };
    } catch (error) {
      console.error("Failed to decode invoice:", error);
      throw error;
    }
  },
};

// Helper function to generate mock transactions
function getMockTransactions(): LightningTransaction[] {
  return [
    {
      id: "tx1",
      amount: 50000,
      date: new Date(Date.now() - 3600000),
      description: "Coffee payment",
      status: "complete",
      type: "outgoing",
    },
    {
      id: "tx2",
      amount: 100000,
      date: new Date(Date.now() - 86400000),
      description: "Friend paid me back",
      status: "complete",
      type: "incoming",
    },
    {
      id: "tx3",
      amount: 25000,
      date: new Date(Date.now() - 172800000),
      description: "Lunch",
      status: "complete",
      type: "outgoing",
    },
    {
      id: "tx4",
      amount: 75000,
      date: new Date(Date.now() - 259200000),
      description: "Bitcoin meetup donation",
      status: "complete",
      type: "outgoing",
    },
  ];
}

// Mempool service for fetching network stats
export const mempoolService = {
  // Get Lightning Network statistics
  getLightningNetworkStats: async (): Promise<NetworkStats> => {
    try {
      // Using public Mempool API for Lightning network stats
      const response = await fetch(
        "https://mempool.space/api/v1/lightning/statistics/latest"
      );

      if (!response.ok) {
        throw new Error(`Mempool API call failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        networkCapacity: data.total_capacity / 100000000, // Convert sats to BTC
        totalChannels: data.channel_count,
        avgFeeRate: data.avg_base_fee_mtokens / 1000, // Convert millitokens to PPM
        nodeCount: data.node_count,
      };
    } catch (error) {
      console.error("Failed to get Lightning network stats:", error);
      // Fall back to mock data
      return {
        networkCapacity: 5234,
        totalChannels: 65432,
        avgFeeRate: 1.2,
        nodeCount: 17895,
      };
    }
  },
};

// Helper to format sats to readable format with commas
export const formatSats = (sats: number): string => {
  return new Intl.NumberFormat().format(sats);
};

// Helper to estimate USD value of sats (would use real exchange rate in production)
export const satsToUSD = (sats: number): string => {
  // Mock exchange rate of ~$41,000 per BTC
  const usdValue = (sats * 0.00041) / 100;
  return usdValue.toFixed(2);
};
