import { useState, useEffect } from 'react';
import { fetchBitcoinTPS } from '../services/api';

interface BitcoinTPSData {
  tps: number;
  timeSpanSeconds: number;
  blocksAnalyzed: number;
  totalTransactions: number;
  pendingTransactions: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinTPSHook {
  data: BitcoinTPSData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
  chartData: any;
}

export const useBitcoinTPS = (refreshInterval = 60000): BitcoinTPSHook => {
  const [data, setData] = useState<BitcoinTPSData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any>({
    labels: ["Current TPS"],
    datasets: [
      {
        label: "Transactions Per Second",
        data: [0],
        backgroundColor: ["#F7931A"],
      },
    ],
  });

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching Bitcoin TPS data, forceRefresh:', forceRefresh);
      const tpsData = await fetchBitcoinTPS(forceRefresh);
      console.log('Received Bitcoin TPS data:', tpsData);
      
      setData(tpsData);
      setIsFromCache(tpsData.fromCache);
      
      // Update chart data
      setChartData({
        labels: ["TPS", "Pending"],
        datasets: [
          {
            label: "Current TPS",
            data: [tpsData.tps, 0],
            backgroundColor: "#F7931A",
          },
          {
            label: "Pending Transactions (scaled)",
            data: [0, Math.min(tpsData.pendingTransactions / 1000, 10)],
            backgroundColor: "#FFB74D",
          }
        ],
      });
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinTPS hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log('Keeping existing TPS data after error');
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately
    fetchData();

    // Set up interval for refreshing
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => fetchData(false), refreshInterval);
      
      // Cleanup interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    isFromCache,
    chartData
  };
};

export default useBitcoinTPS; 