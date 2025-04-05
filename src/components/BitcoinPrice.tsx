import { useState, useEffect } from "react";
import useBitcoinPrice from "../hooks/useBitcoinPrice";
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
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "./ui/badge";

interface BitcoinPriceProps {
  refreshInterval?: number;
}

const BitcoinPrice = ({ refreshInterval = 60000 }: BitcoinPriceProps) => {
  const { data, loading, error, refetch, isFromCache } =
    useBitcoinPrice(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log("BitcoinPrice component state:", {
      data,
      error,
      loading,
      isFromCache,
    });
  }, [data, error, loading, isFromCache]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error refreshing price data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error("Attempted to format undefined date");
      return "Unknown";
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && "isFallback" in data && data.isFallback;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          Bitcoin Price
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
          Current market price from mempool.space
          {isFromCache && data && (
            <Badge
              variant="outline"
              className="ml-2 text-amber-500 border-amber-500"
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
      <CardContent className="pb-3 flex-grow">
        {loading && !data ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-pulse text-3xl font-bold">Loading...</div>
          </div>
        ) : error && !data ? (
          <div className="text-red-500 p-2 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Error loading price data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <div className="text-center">
            <div className="text-4xl font-bold">{data.formattedPrice}</div>

            {isShowingCachedDuringError && (
              <div className="mt-2 text-xs text-amber-500 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Showing cached data due to API limits
              </div>
            )}

            {isShowingFallback && (
              <div className="mt-2 text-xs text-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Showing estimated data
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
          {isShowingFallback && (
            <span className="text-orange-500">Server unavailable</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default BitcoinPrice;
