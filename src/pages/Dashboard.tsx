import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LiveMetricsSection from "@/components/dashboard/sections/LiveMetricsSection";
import NetworkStatsSection from "@/components/dashboard/sections/NetworkStatsSection";
import LightningNetworkSection from "@/components/dashboard/sections/LightningNetworkSection";
import WhaleAndSentimentSection from "@/components/dashboard/sections/WhaleAndSentimentSection";
import AIAndNewsSection from "@/components/dashboard/sections/AIAndNewsSection";
import { X } from "lucide-react";

const Dashboard = () => {
  const { user } = useUser();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Sample data for charts (same as Index page)
  const priceChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Bitcoin Price (USD)",
        data: [42000, 45000, 48000, 51000, 49000, 52000],
        borderColor: "#F7931A",
        backgroundColor: "rgba(247, 147, 26, 0.2)",
      },
    ],
  };

  const gasFeeChartData = {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
    datasets: [
      {
        label: "Gas Fees (sats/vB)",
        data: [15, 18, 22, 19, 24, 21],
        borderColor: "#F7931A",
        backgroundColor: "rgba(247, 147, 26, 0.2)",
      },
    ],
  };

  const tpsChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Transactions Per Second",
        data: [5, 4.2, 6.1, 5.8, 7.2, 6.5, 5.9],
        backgroundColor: ["#F7931A"],
      },
    ],
  };

  const whaleDistributionData = {
    labels: [
      "> 10,000 BTC",
      "1,000-10,000 BTC",
      "100-1,000 BTC",
      "10-100 BTC",
      "< 10 BTC",
    ],
    datasets: [
      {
        data: [15, 23, 32, 20, 10],
        backgroundColor: [
          "#F7931A",
          "#FFB74D",
          "#FFF176",
          "#F7931A",
          "#81C784",
        ],
        borderColor: [
          "rgba(247, 147, 26, 0.8)",
          "rgba(255, 183, 77, 0.8)",
          "rgba(255, 241, 118, 0.8)",
          "rgba(247, 147, 26, 0.8)",
          "rgba(129, 199, 132, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const exchangeReserveData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Exchange Reserve (BTC)",
        data: [2100000, 2050000, 1980000, 1920000, 1890000, 1850000],
        borderColor: "#FF6B6B",
        backgroundColor: "rgba(255, 107, 107, 0.2)",
      },
    ],
  };

  const fundingRateData = {
    labels: ["Binance", "FTX", "Bybit", "OKX", "Deribit"],
    datasets: [
      {
        label: "Funding Rate (%)",
        data: [0.01, -0.005, 0.02, -0.01, 0.015],
        backgroundColor: [
          "#F7931A",
          "#FF6B6B",
          "#F7931A",
          "#FF6B6B",
          "#F7931A",
        ],
      },
    ],
  };

  // Date for the next Bitcoin halving (approximate)
  const nextHalvingDate = new Date("2025-04-20T00:00:00");

  return (
    <DashboardLayout>
      {showWelcomeBanner && (
        <div className="mb-6 p-4 bg-card rounded-lg border border-border relative">
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="Close welcome banner"
          >
            <X size={18} />
          </button>
          <h2 className="text-2xl font-bold">
            Welcome, {user?.firstName || "User"}
          </h2>
          <p className="text-muted-foreground">
            This is your personal dashboard with detailed Bitcoin analytics
          </p>
        </div>
      )}

      {/* Top Row - Live Metrics */}
      <LiveMetricsSection />

      {/* Second Row - Network Stats */}
      <NetworkStatsSection
        gasFeeChartData={gasFeeChartData}
        tpsChartData={tpsChartData}
        nextHalvingDate={nextHalvingDate}
      />

      <LightningNetworkSection priceChartData={priceChartData} />

      {/* Third Row - Whale & Sentiment Data */}
      <WhaleAndSentimentSection
        whaleDistributionData={whaleDistributionData}
        exchangeReserveData={exchangeReserveData}
        fundingRateData={fundingRateData}
      />

      {/* Bottom Section - AI & News */}
      <AIAndNewsSection />
    </DashboardLayout>
  );
};

export default Dashboard;
