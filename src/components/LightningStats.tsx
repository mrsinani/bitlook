import { useState, useEffect } from "react";
import useLightningStats from "../hooks/useLightningStats";
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
  Zap,
  BarChart3,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import useAutoRefreshable from "@/hooks/useAutoRefreshable";

interface LightningStatsProps {
  refreshInterval?: number;
}

const LightningStats = ({ refreshInterval = 60000 }: LightningStatsProps) => {
  const { data, loading, error, refetch, isFromCache } =
    useLightningStats(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Register for auto-refresh when cached
  useAutoRefreshable(
    async () => {
      try {
        await refetch(true);
      } catch (error) {
        console.error("Error auto-refreshing Lightning Network data:", error);
      }
    },
    isFromCache,
    "lightning-stats"
  );

  useEffect(() => {
    // Debug logging to help trace issues
    console.log("LightningStats component state:", {
      data,
      error,
      loading,
      isFromCache,
      retryCount,
    });
  }, [data, error, loading, isFromCache, retryCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error refreshing Lightning data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error("Attempted to format undefined date in LightningStats");
      return "Unknown";
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting time in LightningStats:", error);
      return "Invalid time";
    }
  };

  // Helper functions for safely formatting data
  const formatNumber = (num?: number, decimals = 0) => {
    if (num === undefined || num === null) return "N/A";
    try {
      return num.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });
    } catch (error) {
      console.error("Error formatting number:", error);
      return "N/A";
    }
  };

  const formatBitcoin = (btc?: number) => {
    if (btc === undefined || btc === null) return "N/A";
    try {
      return (
        btc.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        }) + " BTC"
      );
    } catch (error) {
      console.error("Error formatting BTC:", error);
      return "N/A";
    }
  };

  // Generate the display metrics
  const getNodeCount = () => {
    try {
      return data?.nodeCount ? formatNumber(data.nodeCount) : "N/A";
    } catch (error) {
      console.error("Error getting node count:", error);
      return "N/A";
    }
  };

  const getChannelCount = () => {
    try {
      return data?.channelCount ? formatNumber(data.channelCount) : "N/A";
    } catch (error) {
      console.error("Error getting channel count:", error);
      return "N/A";
    }
  };

  const getTotalCapacity = () => {
    try {
      return data?.totalCapacity?.btc
        ? formatBitcoin(data.totalCapacity.btc)
        : "N/A";
    } catch (error) {
      console.error("Error getting total capacity:", error);
      return "N/A";
    }
  };

  const getAvgChannelSize = () => {
    try {
      if (!data?.avgChannelSize?.btc) return "N/A";
      return (
        data.avgChannelSize.btc.toLocaleString(undefined, {
          maximumFractionDigits: 5,
        }) + " BTC"
      );
    } catch (error) {
      console.error("Error getting avg channel size:", error);
      return "N/A";
    }
  };

  // Calculate channels per node from available data
  const getChannelsPerNode = () => {
    try {
      // First check if the API provided the value directly
      if (data?.avgChannelsPerNode) {
        return formatNumber(data.avgChannelsPerNode, 1);
      }

      // If not, calculate it from node count and channel count
      if (data?.nodeCount && data?.channelCount && data.nodeCount > 0) {
        const calculatedValue = data.channelCount / data.nodeCount;
        return formatNumber(calculatedValue, 1);
      }

      return "N/A";
    } catch (error) {
      console.error("Error calculating channels per node:", error);
      return "N/A";
    }
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && "isFallback" in data && data.isFallback;

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Lightning Network
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
          Bitcoin's second layer scaling solution
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
          {isShowingFallback && (
            <Badge
              variant="outline"
              className="ml-2 text-orange-500 border-orange-500"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Estimated
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-pulse text-3xl font-bold">Loading...</div>
          </div>
        ) : error && !data ? (
          <div className="text-red-500 p-4 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Error loading Lightning data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Nodes
                </div>
                <div className="text-xl font-bold text-foreground">
                  {getNodeCount()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Channels
                </div>
                <div className="text-xl font-bold text-foreground">
                  {getChannelCount()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-1 flex justify-between">
                <span>Total Capacity</span>
                <span>{getTotalCapacity()}</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>

            <div className="pt-2 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Avg. Channel Size
                </div>
                <div className="text-foreground">{getAvgChannelSize()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Channels per Node
                </div>
                <div className="text-foreground">{getChannelsPerNode()}</div>
              </div>
            </div>

            {isShowingCachedDuringError && (
              <div className="mt-2 text-xs text-amber-500 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Showing cached data due to API rate limits
              </div>
            )}

            {isShowingFallback && (
              <div className="mt-2 text-xs text-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Showing estimated data due to server issues
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
      {data && (
        <CardFooter className="text-xs text-muted-foreground flex justify-between">
          <span>Last updated: {formatTime(data.lastUpdated)}</span>
          {isFromCache && (
            <span className="text-amber-500">Refresh limit reached</span>
          )}
          {isShowingFallback && (
            <span className="text-orange-500">Server unavailable</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default LightningStats;
