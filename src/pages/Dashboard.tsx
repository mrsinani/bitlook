import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LiveMetricsSection from "@/components/dashboard/sections/LiveMetricsSection";
import NetworkStatsSection from "@/components/dashboard/sections/NetworkStatsSection";
import LightningNetworkSection from "@/components/dashboard/sections/LightningNetworkSection";
import WhaleAndSentimentSection from "@/components/dashboard/sections/WhaleAndSentimentSection";
import AIAndNewsSection from "@/components/dashboard/sections/AIAndNewsSection";
import { X } from "lucide-react";
import { DashboardVisibility } from "./Preferences";
import { getUserPreferences, defaultPreferences } from "@/lib/userPreferences";
import useBitcoinHistory from "@/hooks/useBitcoinHistory";

const Dashboard = () => {
  const { user } = useUser();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [visibility, setVisibility] = useState<DashboardVisibility>(
    defaultPreferences.dashboardVisibility
  );
  const [isLoading, setIsLoading] = useState(true);
  const { chartData: bitcoinHistoryChartData, loading: bitcoinHistoryLoading } =
    useBitcoinHistory();

  // Load visibility preferences from Supabase on mount
  useEffect(() => {
    async function fetchUserPreferences() {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const preferences = await getUserPreferences(user.id);
        setVisibility(preferences.dashboardVisibility);
      } catch (error) {
        console.error("Failed to load dashboard preferences", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPreferences();
  }, [user?.id]);

  // Sample data for other charts (besides Bitcoin price chart)
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

  // Date for the next Bitcoin halving (approximate)
  const nextHalvingDate = new Date("2025-04-20T00:00:00");

  // Calculate the grid layout CSS to maintain spacing
  // This ensures a consistent grid layout even when elements are hidden
  const getGridClasses = () => {
    let visibleSectionsCount = 0;
    if (visibility.liveMetrics) visibleSectionsCount++;
    if (visibility.networkStats) visibleSectionsCount++;
    if (visibility.lightningNetwork) visibleSectionsCount++;
    if (visibility.whaleAndSentiment) visibleSectionsCount++;
    if (visibility.aiAndNews) visibleSectionsCount++;

    return "space-y-6"; // Maintain consistent spacing between sections
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading your dashboard preferences...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

      <div className={getGridClasses()}>
        {/* Top Row - Live Metrics */}
        {visibility.liveMetrics && <LiveMetricsSection />}

        {/* Second Row - Network Stats */}
        {visibility.networkStats && <NetworkStatsSection />}

        {/* Lightning Network Section */}
        {visibility.lightningNetwork && (
          <LightningNetworkSection
            priceChartData={bitcoinHistoryChartData}
            isLoading={bitcoinHistoryLoading}
          />
        )}

        {/* Third Row - Whale & Sentiment Data */}
        {visibility.whaleAndSentiment && (
          <WhaleAndSentimentSection
            whaleDistributionData={whaleDistributionData}
            exchangeReserveData={exchangeReserveData}
          />
        )}

        {/* Bottom Section - AI & News */}
        {visibility.aiAndNews && <AIAndNewsSection />}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
