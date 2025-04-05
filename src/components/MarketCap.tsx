import { useState, useEffect } from "react";
import useBitcoinMarketData from "../hooks/useBitcoinMarketData";
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
} from "lucide-react";
import { Badge } from "./ui/badge";

interface MarketCapProps {
  refreshInterval?: number;
}

const MarketCap = ({ refreshInterval = 60000 }: MarketCapProps) => {
  const { data, loading, error, refetch, isFromCache } =
    useBitcoinMarketData(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error refreshing market data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && "isFallback" in data && data.isFallback;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          Market Cap
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
          Total Bitcoin market capitalization
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
              <p>Error loading market data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "CoinGecko may be rate limiting requests."}
            </p>
          </div>
        ) : data ? (
          <div className="text-center">
            <div className="text-4xl font-bold">{data.formattedMarketCap}</div>
            {data.priceChange24h !== 0 && (
              <div
                className={`mt-1 text-sm ${
                  data.priceChange24h > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {data.priceChange24h > 0 ? "↑" : "↓"}{" "}
                {Math.abs(data.priceChange24h).toFixed(2)}% (24h)
              </div>
            )}

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

export default MarketCap;
