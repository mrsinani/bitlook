import { useState, useEffect } from "react";
import useBitcoinTPS from "../hooks/useBitcoinTPS";
import useMempoolStats from "../hooks/useMempoolStats";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  RefreshCw,
  DatabaseIcon,
  AlertCircle,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { Badge } from "./ui/badge";
import BarChart from "@/components/dashboard/charts/BarChart";
import useAutoRefreshable from "@/hooks/useAutoRefreshable";

interface TransactionsPerSecondProps {
  refreshInterval?: number;
}

const TransactionsPerSecond = ({
  refreshInterval = 60000,
}: TransactionsPerSecondProps) => {
  const { data, loading, error, refetch, isFromCache, chartData } =
    useBitcoinTPS(refreshInterval);
  const { data: mempoolData } = useMempoolStats(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Register for auto-refresh when cached
  useAutoRefreshable(
    async () => {
      // Don't set refreshing state here to avoid UI flicker during auto refresh
      try {
        await refetch(true);
        setRetryCount((prev) => prev + 1);
      } catch (error) {
        console.error("Error auto-refreshing TPS data:", error);
      }
    },
    isFromCache,
    "transactions-per-second" // Unique ID for this component
  );

  useEffect(() => {
    // Debug logging to help trace issues
    console.log("TPS component state:", {
      data,
      error,
      loading,
      isFromCache,
      retryCount,
      chartData,
      mempoolData,
    });
  }, [data, error, loading, isFromCache, retryCount, chartData, mempoolData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error refreshing TPS data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error("Attempted to format undefined date in TPS");
      return "Unknown";
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting time in TPS:", error);
      return "Invalid time";
    }
  };

  // Helper functions to safely get data
  const getFormattedTPS = () => {
    try {
      if (!data || data.tps === undefined || data.tps === null) return "N/A";
      return data.tps.toFixed(2);
    } catch (error) {
      console.error("Error formatting TPS:", error);
      return "N/A";
    }
  };

  const getPendingTxs = () => {
    try {
      if (!data || data.pendingTransactions === undefined) return "N/A";
      return data.pendingTransactions.toLocaleString();
    } catch (error) {
      console.error("Error formatting pending transactions:", error);
      return "N/A";
    }
  };

  // Safely format the timespan
  const getTimeSpan = () => {
    try {
      if (!data || !data.timeSpanSeconds) return "N/A";

      // Ensure the timespan is reasonable (not more than 24 hours)
      const minutes = Math.min(Math.round(data.timeSpanSeconds / 60), 1440);

      // Format as minutes or hours depending on the value
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = (minutes / 60).toFixed(1);
        return `${hours} hours`;
      }
    } catch (error) {
      console.error("Error formatting timespan:", error);
      return "N/A";
    }
  };

  // Get mempool size in MB
  const getMempoolSizeMB = () => {
    try {
      if (!mempoolData || !mempoolData.vsize) return null;
      const sizeMB = mempoolData.vsize / 1_000_000;
      return sizeMB.toFixed(2);
    } catch (error) {
      console.error("Error calculating mempool size:", error);
      return null;
    }
  };

  // Estimate time to clear mempool at current TPS
  const getEstimatedClearTime = () => {
    try {
      if (!data || !data.tps || !data.pendingTransactions || data.tps === 0)
        return null;

      // Estimate seconds to clear
      const secondsToClear = data.pendingTransactions / data.tps;

      // Convert to appropriate units
      if (secondsToClear < 60) {
        return "Less than a minute";
      } else if (secondsToClear < 3600) {
        const minutes = Math.round(secondsToClear / 60);
        return `~${minutes} minute${minutes !== 1 ? "s" : ""}`;
      } else if (secondsToClear < 86400) {
        const hours = Math.round(secondsToClear / 3600);
        return `~${hours} hour${hours !== 1 ? "s" : ""}`;
      } else {
        const days = Math.round(secondsToClear / 86400);
        return `~${days} day${days !== 1 ? "s" : ""}`;
      }
    } catch (error) {
      console.error("Error estimating clear time:", error);
      return null;
    }
  };

  // Estimate number of blocks needed to clear mempool
  const getEstimatedBlocksToClear = () => {
    try {
      if (!mempoolData || !mempoolData.vsize) return null;

      // Average Bitcoin block size is about 1.5MB
      const avgBlockSize = 1_500_000;
      const blocksNeeded = Math.ceil(mempoolData.vsize / avgBlockSize);

      return blocksNeeded;
    } catch (error) {
      console.error("Error estimating blocks to clear:", error);
      return null;
    }
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && "isFallback" in data && data.isFallback;

  // Get additional context
  const mempoolSizeMB = getMempoolSizeMB();
  const estimatedClearTime = getEstimatedClearTime();
  const estimatedBlocks = getEstimatedBlocksToClear();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-orange-500" />
            Transactions Per Second
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center">
          Current Bitcoin network throughput
          {isFromCache && data && (
            <Badge
              variant="outline"
              className="ml-2 text-amber-500 border-amber-500"
              title="Auto-refreshing every 5 seconds"
            >
              <DatabaseIcon className="h-3 w-3 mr-1" />
              Cached
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        {loading && !data ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-pulse text-3xl font-bold">Loading...</div>
          </div>
        ) : error && !data ? (
          <div className="text-red-500 p-2 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Error loading TPS data.</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                {getFormattedTPS()}
              </div>
              <div className="text-xs text-muted-foreground">
                {data && data.blocksAnalyzed
                  ? `${
                      data.blocksAnalyzed
                    } blocks analyzed over ${getTimeSpan()}`
                  : "Analyzing blockchain data..."}
              </div>
            </div>

            <div className="pt-2">
              <BarChart data={chartData} height={120} />
            </div>

            <div className="text-xs text-center text-muted-foreground">
              <span className="font-semibold">{getPendingTxs()}</span>{" "}
              transactions waiting in mempool
              {mempoolSizeMB && (
                <span className="ml-1">
                  (<span>{mempoolSizeMB} MB</span>)
                </span>
              )}
            </div>

            {estimatedBlocks && (
              <div className="text-xs text-center text-muted-foreground">
                Est. blocks needed:{" "}
                <span className="font-medium">
                  {estimatedBlocks.toString()}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
      {data && (
        <CardFooter className="text-xs text-muted-foreground flex justify-between pt-0">
          <span>Last updated: {formatTime(data.lastUpdated)}</span>
          {isFromCache && (
            <span className="text-amber-500">Refresh limit reached</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TransactionsPerSecond;
