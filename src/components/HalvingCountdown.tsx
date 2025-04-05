import { useState, useEffect } from 'react';
import useBitcoinHalving from '../hooks/useBitcoinHalving';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, DatabaseIcon, AlertCircle, AlertTriangle, Clock, Bitcoin } from 'lucide-react';
import { Badge } from './ui/badge';

interface HalvingCountdownProps {
  refreshInterval?: number;
}

const HalvingCountdown = ({ refreshInterval = 300000 }: HalvingCountdownProps) => {
  const { data, loading, error, refetch, isFromCache, timeRemaining } = useBitcoinHalving(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log('HalvingCountdown component state:', { 
      data, 
      error, 
      loading, 
      isFromCache,
      retryCount,
      timeRemaining
    });
  }, [data, error, loading, isFromCache, retryCount, timeRemaining]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing halving data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error('Attempted to format undefined date in HalvingCountdown');
      return 'Unknown';
    }
    try {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting time in HalvingCountdown:', error);
      return 'Invalid date';
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "00";
    return num.toString().padStart(2, "0");
  };

  // Helper functions to safely get data
  const getBlocksRemaining = () => {
    try {
      return data?.blocksRemaining ? data.blocksRemaining.toLocaleString() : 'N/A';
    } catch (error) {
      console.error('Error formatting blocks remaining:', error);
      return 'N/A';
    }
  };

  const getFormattedHalvingDate = () => {
    try {
      return data?.estimatedHalvingDate ? formatTime(data.estimatedHalvingDate) : 'N/A';
    } catch (error) {
      console.error('Error formatting halving date:', error);
      return 'N/A';
    }
  };

  const getRewardInfo = () => {
    try {
      if (!data) return 'N/A';
      return `${data.currentReward} BTC → ${data.nextReward} BTC`;
    } catch (error) {
      console.error('Error formatting reward info:', error);
      return 'N/A';
    }
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && 'isFallback' in data && data.isFallback;

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
            Bitcoin Halving Countdown
          </span>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center">
          Time until next block reward halving
          {isFromCache && data && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
              <DatabaseIcon className="h-3 w-3 mr-1" />
              Cached
            </Badge>
          )}
          {isShowingFallback && (
            <Badge variant="outline" className="ml-2 text-orange-500 border-orange-500">
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
              <p>Error loading halving data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data && timeRemaining ? (
          <div className="flex flex-col gap-6 py-4 items-center">
            <div className="grid grid-cols-4 gap-4 w-full max-w-md">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-foreground">{formatNumber(timeRemaining.days)}</div>
                <div className="text-xs text-muted-foreground mt-1">Days</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-foreground">{formatNumber(timeRemaining.hours)}</div>
                <div className="text-xs text-muted-foreground mt-1">Hours</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-foreground">{formatNumber(timeRemaining.minutes)}</div>
                <div className="text-xs text-muted-foreground mt-1">Minutes</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-foreground">{formatNumber(timeRemaining.seconds)}</div>
                <div className="text-xs text-muted-foreground mt-1">Seconds</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-center w-full">
              <div>
                <span className="text-sm font-medium">Blocks Remaining: </span>
                <span className="text-sm text-foreground">{getBlocksRemaining()}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Expected Date: </span>
                <span className="text-sm text-foreground">{getFormattedHalvingDate()}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Reward Change: </span>
                <span className="text-sm text-foreground">{getRewardInfo()}</span>
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

export default HalvingCountdown; 