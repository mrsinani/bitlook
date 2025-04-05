import { useState, useEffect } from 'react';
import useBitcoinFees from '../hooks/useBitcoinFees';
import useMempoolStats from '../hooks/useMempoolStats';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, DatabaseIcon, AlertCircle, AlertTriangle, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface GasFeesProps {
  refreshInterval?: number;
}

const GasFees = ({ refreshInterval = 60000 }: GasFeesProps) => {
  const { data, loading, error, refetch, isFromCache } = useBitcoinFees(refreshInterval);
  const { data: mempoolData } = useMempoolStats(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Debug logging to help trace issues
    console.log('GasFees component state:', { 
      data, 
      error, 
      loading, 
      isFromCache,
      retryCount,
      mempoolData
    });
  }, [data, error, loading, isFromCache, retryCount, mempoolData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing fee data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error('Attempted to format undefined date in GasFees');
      return 'Unknown';
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time in GasFees:', error);
      return 'Invalid time';
    }
  };

  // Helper functions to safely get data
  const getFeeRange = () => {
    try {
      if (!data) return 'N/A';
      return `${data.minimumFee} - ${data.fastestFee} sat/vB`;
    } catch (error) {
      console.error('Error getting fee range:', error);
      return 'N/A';
    }
  };

  // Determine fee level description
  const getFeeLevel = () => {
    try {
      if (!data) return { text: 'Unknown', color: 'text-gray-500' };
      
      const fastestFee = data.fastestFee;
      
      if (fastestFee > 100) return { text: 'Very High', color: 'text-red-600' };
      if (fastestFee > 50) return { text: 'High', color: 'text-orange-500' };
      if (fastestFee > 20) return { text: 'Medium', color: 'text-yellow-500' };
      if (fastestFee > 10) return { text: 'Low', color: 'text-green-500' };
      return { text: 'Very Low', color: 'text-green-600' };
    } catch (error) {
      console.error('Error determining fee level:', error);
      return { text: 'Unknown', color: 'text-gray-500' };
    }
  };

  // Get mempool size in MB
  const getMempoolSize = () => {
    try {
      if (!mempoolData || !mempoolData.vsize) return null;
      const sizeMB = mempoolData.vsize / 1_000_000;
      return sizeMB.toFixed(2);
    } catch (error) {
      console.error('Error calculating mempool size:', error);
      return null;
    }
  };

  // Get mempool congestion level
  const getCongestionLevel = () => {
    try {
      if (!mempoolData || !mempoolData.vsize) return null;
      
      const sizeMB = mempoolData.vsize / 1_000_000;
      
      if (sizeMB > 80) return { text: 'Extreme', color: 'text-red-700' };
      if (sizeMB > 40) return { text: 'Very High', color: 'text-red-600' };
      if (sizeMB > 20) return { text: 'High', color: 'text-orange-500' };
      if (sizeMB > 5) return { text: 'Medium', color: 'text-yellow-500' };
      if (sizeMB > 1) return { text: 'Low', color: 'text-green-500' };
      return { text: 'Very Low', color: 'text-green-600' };
    } catch (error) {
      console.error('Error determining congestion level:', error);
      return null;
    }
  };

  // Check if we're showing error but have cached data
  const isShowingCachedDuringError = error && data && isFromCache;
  // Check if we're showing fallback data
  const isShowingFallback = data && 'isFallback' in data && data.isFallback;
  
  // Get current fee level
  const feeLevel = getFeeLevel();
  // Get congestion level
  const congestionLevel = getCongestionLevel();
  // Get mempool size
  const mempoolSize = getMempoolSize();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Bitcoin Gas Fees
          </span>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center">
          {mempoolSize ? (
            <span>Mempool: {mempoolSize} MB {congestionLevel ? `• ${congestionLevel.text} congestion` : ''}</span>
          ) : (
            <span>Current mempool fee recommendations</span>
          )}
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
              <p>Error loading fee data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${feeLevel.color}`}>{feeLevel.text}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {getFeeRange()}
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Fastest</span>
                    <span>{data.fastestFee} sat/vB</span>
                  </div>
                  <Progress value={(data.fastestFee / Math.max(data.fastestFee, 100)) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>30 minutes</span>
                    <span>{data.halfHourFee} sat/vB</span>
                  </div>
                  <Progress value={(data.halfHourFee / Math.max(data.fastestFee, 100)) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>1 hour</span>
                    <span>{data.hourFee} sat/vB</span>
                  </div>
                  <Progress value={(data.hourFee / Math.max(data.fastestFee, 100)) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-yellow-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Economy</span>
                    <span>{data.economyFee} sat/vB</span>
                  </div>
                  <Progress value={(data.economyFee / Math.max(data.fastestFee, 100)) * 100} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
                </div>
              </div>
            </div>
            
            {mempoolData && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                {mempoolData.count.toLocaleString()} transactions waiting to be confirmed
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

export default GasFees; 