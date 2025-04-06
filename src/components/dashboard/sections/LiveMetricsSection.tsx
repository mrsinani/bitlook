import React from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  Bitcoin,
  CircleDollarSign,
  Database,
  ArrowUpRight,
} from "lucide-react";
import BitcoinPrice from "@/components/BitcoinPrice";
import MarketCap from "@/components/MarketCap";
import CirculatingSupply from "@/components/CirculatingSupply";
import BlockchainHeight from "@/components/BlockchainHeight";
import ErrorBoundary from "@/components/ErrorBoundary";

const LiveMetricsSection = () => {
  // Fallback UI for metric cards when they error
  const metricErrorFallback = (title: string) => (
    <div className="w-full h-full p-4 bg-white rounded-lg border shadow-sm">
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <div className="text-red-500 text-sm">
        Failed to load data. Please check your connection and try again.
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="col-span-1">
        <ErrorBoundary fallback={metricErrorFallback("Bitcoin Price")}>
          <BitcoinPrice />
        </ErrorBoundary>
      </div>
      <div className="col-span-1">
        <ErrorBoundary fallback={metricErrorFallback("Market Cap")}>
          <MarketCap />
        </ErrorBoundary>
      </div>
      <div className="col-span-1">
        <ErrorBoundary fallback={metricErrorFallback("Circulating Supply")}>
          <CirculatingSupply />
        </ErrorBoundary>
      </div>
      <div className="col-span-1">
        <ErrorBoundary fallback={metricErrorFallback("Blockchain Height")}>
          <BlockchainHeight />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default LiveMetricsSection;
