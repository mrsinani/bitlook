import { useState, useEffect } from "react";
import useBitcoinSupply from "../hooks/useBitcoinSupply";
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
import { Progress } from "./ui/progress";

interface CirculatingSupplyProps {
  refreshInterval?: number;
}

const CirculatingSupply = ({
  refreshInterval = 60000,
}: CirculatingSupplyProps) => {
  const { data, loading, error, refetch, isFromCache } =
    useBitcoinSupply(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log("CirculatingSupply component state:", {
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
      console.error("Error refreshing supply data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error("Attempted to format undefined date in CirculatingSupply");
      return "Unknown";
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting time in CirculatingSupply:", error);
      return "Invalid time";
    }
  };

  // Helper functions to safely get data
  const getFormattedSupply = () => {
    try {
      return data?.formattedCirculatingSupply || "N/A";
    } catch (error) {
      console.error("Error formatting circulating supply:", error);
      return "N/A";
    }
  };

  const getMaxSupply = () => {
    try {
      return data?.maxSupply ? data.maxSupply.toLocaleString() : "21,000,000";
    } catch (error) {
      console.error("Error formatting max supply:", error);
      return "21,000,000";
    }
  };

  const getPercentMined = () => {
    try {
      return data?.percentMined ? data.percentMined.toFixed(2) : "92.85";
    } catch (error) {
      console.error("Error formatting percent mined:", error);
      return "92.85";
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
          Circulating Supply
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
          Total Bitcoin mined so far
          {isFromCache && data && (
            <Badge
              variant="outline"
              className="ml-2 text-amber-500 border-amber-500"
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
              <p>Error loading supply data.</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-4xl font-bold">{getFormattedSupply()}</div>
              <div className="text-xs text-muted-foreground">
                of {getMaxSupply()} BTC
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Percent Mined</span>
                <span>{getPercentMined()}%</span>
              </div>
              <Progress value={Number(getPercentMined())} className="h-1" />
            </div>
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

export default CirculatingSupply;
