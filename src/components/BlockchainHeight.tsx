import { useState, useEffect } from 'react';
import useBlockchainHeight from '../hooks/useBlockchainHeight';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, DatabaseIcon, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface BlockchainHeightProps {
  refreshInterval?: number;
}

const BlockchainHeight = ({ refreshInterval = 30000 }: BlockchainHeightProps) => {
  const { data, loading, error, refetch, isFromCache, previousHeight } = useBlockchainHeight(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log('BlockchainHeight component state:', { 
      data, 
      error, 
      loading, 
      isFromCache,
      previousHeight,
      retryCount 
    });
  }, [data, error, loading, isFromCache, previousHeight, retryCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing blockchain height:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error('Attempted to format undefined date in BlockchainHeight');
      return 'Unknown';
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time in BlockchainHeight:', error);
      return 'Invalid time';
    }
  };

  // Calculate blocks mined since last update - with defensive programming
  const calculateChange = () => {
    if (!data || previousHeight === null) return null;
    
    try {
      const change = data.height - previousHeight;
      return {
        value: `+${change} ${change === 1 ? 'block' : 'blocks'}`,
        positive: true,
      };
    } catch (error) {
      console.error('Error calculating blockchain height change:', error);
      return null;
    }
  };

  const change = calculateChange();

  // Helper functions for safely accessing data
  const getFormattedHeight = () => {
    try {
      return data?.formattedHeight || 'N/A';
    } catch (error) {
      console.error('Error formatting blockchain height:', error);
      return 'N/A';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Blockchain Height
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center">
          Current Bitcoin blockchain height
          {isFromCache && data && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
              <DatabaseIcon className="h-3 w-3 mr-1" />
              Cached
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
              <p>Error loading blockchain height.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <div className="text-center">
            <div className="text-4xl font-bold">{getFormattedHeight()}</div>
            {change && (
              <div className="mt-2 text-sm text-gray-500">
                {change.value}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
      {data && (
        <CardFooter className="text-xs text-muted-foreground flex justify-between">
          <span>Last updated: {formatTime(data.lastUpdated)}</span>
          {isFromCache && (
            <span className="text-amber-500">Using cached data</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default BlockchainHeight; 