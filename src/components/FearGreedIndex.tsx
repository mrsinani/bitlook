import { useState, useEffect } from 'react';
import useFearGreedIndex from '../hooks/useFearGreedIndex';
import FearGreedGauge from './dashboard/charts/FearGreedGauge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, DatabaseIcon, AlertCircle, AlertTriangle, Gauge } from 'lucide-react';
import { Badge } from './ui/badge';

interface FearGreedIndexProps {
  refreshInterval?: number;
}

const FearGreedIndex = ({ refreshInterval = 300000 }: FearGreedIndexProps) => {
  const { data, loading, error, refetch, isFromCache } = useFearGreedIndex(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log('FearGreedIndex component state:', { 
      data, 
      error, 
      loading, 
      isFromCache,
      retryCount
    });
  }, [data, error, loading, isFromCache, retryCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing Fear & Greed data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error('Attempted to format undefined date in FearGreedIndex');
      return 'Unknown';
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time in FearGreedIndex:', error);
      return 'Invalid time';
    }
  };

  // Get the current index value, defaulting to 50 (neutral) if not available
  const getValue = () => {
    try {
      return data?.value ?? 50;
    } catch (error) {
      console.error('Error getting value:', error);
      return 50;
    }
  };

  // Get the classification text for the current value
  const getClassification = () => {
    try {
      return data?.valueClassification ?? 'Neutral';
    } catch (error) {
      console.error('Error getting classification:', error);
      return 'Neutral';
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
            <Gauge className="h-5 w-5 mr-2 text-amber-500" />
            Fear & Greed Index
          </span>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center">
          Market sentiment indicator
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-3xl font-bold">Loading...</div>
          </div>
        ) : error && !data ? (
          <div className="text-red-500 p-4 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Error loading Fear & Greed data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center">
            <FearGreedGauge 
              title=""
              value={getValue()}
              height="h-[250px]"
            />
            <div className="mt-2 text-sm font-medium">
              Current Market Sentiment: <span className="font-bold">{getClassification()}</span>
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

export default FearGreedIndex; 