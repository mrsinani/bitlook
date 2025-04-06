import { useState, useEffect } from 'react';
import useFundingRate, { ExchangeFundingData } from '../hooks/useFundingRate';
import BarChart from './dashboard/charts/BarChart';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, DatabaseIcon, AlertCircle, AlertTriangle, BarChart3, ArrowUpDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface FundingRateProps {
  refreshInterval?: number;
}

const FundingRate = ({ refreshInterval = 180000 }: FundingRateProps) => {
  const { data, loading, error, refetch, isFromCache } = useFundingRate(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [chartData, setChartData] = useState({
    labels: ['Current Rate'],
    datasets: [
      {
        label: 'Funding Rate (%)',
        data: [0],
        backgroundColor: ['#F7931A']
      }
    ]
  });
  
  const [exchangeChartData, setExchangeChartData] = useState({
    labels: ['Kraken', 'Binance', 'Bybit', 'OKX'],
    datasets: [
      {
        label: 'Funding Rate (%)',
        data: [0, 0, 0, 0],
        backgroundColor: ['#5741d9', '#F0B90B', '#f7465a', '#121212']
      }
    ]
  });

  useEffect(() => {
    // Debug logging to help trace issues
    console.log('FundingRate component state:', { 
      data, 
      error, 
      loading, 
      isFromCache,
      retryCount
    });

    // Update chart data when the funding rate data changes
    if (data) {
      // Format the rate as percentage for main chart
      const currentRatePercent = data.currentRate * 100;
      const predictedRatePercent = data.predictedRate * 100;

      // Choose colors based on whether the rate is positive or negative
      const currentColor = currentRatePercent >= 0 ? '#F7931A' : '#FF6B6B';
      const predictedColor = predictedRatePercent >= 0 ? '#F7931A' : '#FF6B6B';

      setChartData({
        labels: ['Current Rate', 'Predicted Next Rate'],
        datasets: [
          {
            label: 'Funding Rate (%)',
            data: [currentRatePercent, predictedRatePercent],
            backgroundColor: [currentColor, predictedColor]
          }
        ]
      });
      
      // Update exchange comparison chart if we have exchange data
      if (data.exchanges) {
        const exchangeLabels: string[] = [];
        const exchangeRates: number[] = [];
        const exchangeColors: string[] = [];
        
        // Add data for each exchange that has data
        if (data.exchanges.kraken) {
          exchangeLabels.push('Kraken');
          exchangeRates.push(data.exchanges.kraken.currentRate * 100);
          exchangeColors.push('#5741d9'); // Kraken color
        }
        
        if (data.exchanges.binance) {
          exchangeLabels.push('Binance');
          exchangeRates.push(data.exchanges.binance.currentRate * 100);
          exchangeColors.push('#F0B90B'); // Binance color
        }
        
        if (data.exchanges.bybit) {
          exchangeLabels.push('Bybit');
          exchangeRates.push(data.exchanges.bybit.currentRate * 100);
          exchangeColors.push('#f7465a'); // Bybit color
        }
        
        if (data.exchanges.okx) {
          exchangeLabels.push('OKX');
          exchangeRates.push(data.exchanges.okx.currentRate * 100);
          exchangeColors.push('#121212'); // OKX color
        }
        
        if (exchangeLabels.length > 0) {
          setExchangeChartData({
            labels: exchangeLabels,
            datasets: [
              {
                label: 'Funding Rate (%)',
                data: exchangeRates,
                backgroundColor: exchangeColors
              }
            ]
          });
        }
      }
    }
  }, [data, error, loading, isFromCache, retryCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh data from API
      await refetch(true);
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing funding rate data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      console.error('Attempted to format undefined date in FundingRate');
      return 'Unknown';
    }
    try {
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time in FundingRate:', error);
      return 'Invalid time';
    }
  };

  // Get the current sentiment text
  const getSentiment = () => {
    try {
      return data?.sentiment ?? 'Neutral';
    } catch (error) {
      console.error('Error getting sentiment:', error);
      return 'Neutral';
    }
  };

  // Format the rate as a percentage
  const formatRate = (rate?: number) => {
    if (rate === undefined || rate === null) return 'N/A';
    try {
      // Convert rate to percentage and format
      const percentage = rate * 100;
      const sign = percentage >= 0 ? '+' : '';
      return `${sign}${percentage.toFixed(4)}%`;
    } catch (error) {
      console.error('Error formatting rate:', error);
      return 'N/A';
    }
  };

  // Get the source of the data
  const getSource = () => {
    try {
      return data?.source ?? 'Unknown';
    } catch (error) {
      console.error('Error getting source:', error);
      return 'Unknown';
    }
  };
  
  // Get exchange count
  const getExchangeCount = () => {
    try {
      return data?.exchangeCount ?? 0;
    } catch (error) {
      console.error('Error getting exchange count:', error);
      return 0;
    }
  };
  
  // Render a badge for a specific exchange
  const renderExchangeBadge = (name: string, data: ExchangeFundingData | null) => {
    if (!data) return null;
    
    const ratePercent = data.currentRate * 100;
    const color = ratePercent >= 0 ? 'text-green-500' : 'text-red-500';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="ml-1">
              <span className="font-medium mr-1">{name}</span>
              <span className={color}>{formatRate(data.currentRate)}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{name} {data.symbol}</p>
            <p className="text-xs">Mark Price: ${data.markPrice.toLocaleString()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Funding Rate
          </span>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="flex items-center flex-wrap">
          {data ? (
            <div className="flex flex-wrap items-center gap-1">
              <span>{getExchangeCount()} exchanges • {getSentiment()}</span>
              {data.exchanges && (
                <>
                  {renderExchangeBadge('Kraken', data.exchanges.kraken)}
                  {renderExchangeBadge('Binance', data.exchanges.binance)}
                  {renderExchangeBadge('Bybit', data.exchanges.bybit)}
                  {renderExchangeBadge('OKX', data.exchanges.okx)}
                </>
              )}
            </div>
          ) : (
            <span>BTC perpetual swap funding</span>
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-3xl font-bold">Loading...</div>
          </div>
        ) : error && !data ? (
          <div className="text-red-500 p-4 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Error loading funding rate data.</p>
            </div>
            <p className="text-xs mt-1">
              {error.message || "API may be temporarily unavailable."}
            </p>
          </div>
        ) : data ? (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Aggregated Rate</div>
                  <div className="text-xl font-bold text-foreground">{formatRate(data.currentRate)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Market Sentiment</div>
                  <div className="text-xl font-bold text-foreground">{getSentiment()}</div>
                </div>
              </div>
              
              <div className="h-48 mt-4">
                <BarChart
                  title=""
                  data={chartData}
                  height="h-full"
                />
              </div>
              
              <div className="pt-2 text-xs text-muted-foreground">
                <p>{data.explanation}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="exchanges" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Comparing rates across {getExchangeCount()} exchanges
                </div>
                <Badge variant="outline" className="flex items-center">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  8-hour interval
                </Badge>
              </div>
              
              <div className="h-48 mt-2">
                <BarChart
                  title=""
                  data={exchangeChartData}
                  height="h-full"
                />
              </div>
              
              {data.exchanges && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {data.exchanges.kraken && (
                    <div className="border rounded p-2">
                      <div className="text-xs font-medium">Kraken</div>
                      <div className="flex justify-between text-xs">
                        <span>Current: {formatRate(data.exchanges.kraken.currentRate)}</span>
                        <span>Next: {formatRate(data.exchanges.kraken.predictedRate)}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.exchanges.binance && (
                    <div className="border rounded p-2">
                      <div className="text-xs font-medium">Binance</div>
                      <div className="flex justify-between text-xs">
                        <span>Current: {formatRate(data.exchanges.binance.currentRate)}</span>
                        <span>Next: {formatRate(data.exchanges.binance.predictedRate)}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.exchanges.bybit && (
                    <div className="border rounded p-2">
                      <div className="text-xs font-medium">Bybit</div>
                      <div className="flex justify-between text-xs">
                        <span>Current: {formatRate(data.exchanges.bybit.currentRate)}</span>
                        <span>Price: ${data.exchanges.bybit.markPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {data.exchanges.okx && (
                    <div className="border rounded p-2">
                      <div className="text-xs font-medium">OKX</div>
                      <div className="flex justify-between text-xs">
                        <span>Current: {formatRate(data.exchanges.okx.currentRate)}</span>
                        <span>Next: {formatRate(data.exchanges.okx.predictedRate)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
        
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

export default FundingRate; 