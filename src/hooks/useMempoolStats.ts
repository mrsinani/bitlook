import { useState, useEffect } from 'react';
import { fetchMempoolStats } from '../services/api';

// Interface for the hook's return value
export interface MempoolStatsHook {
  data: MempoolStatsData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

// Interface for the data returned from the API
export interface MempoolStatsData {
  count: number;
  vsize: number;
  totalFee: number;
  feeHistogram: [number, number][];
  currentBlockHeight: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

/**
 * Hook for fetching Bitcoin mempool statistics
 * @param refreshInterval - Interval in milliseconds to refresh the data (default: 1 minute)
 * @returns An object containing the data, loading state, error, and refetch function
 */
const useMempoolStats = (refreshInterval = 60000): MempoolStatsHook => {
  const [data, setData] = useState<MempoolStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const result = await fetchMempoolStats(forceRefresh);
      setData(result);
      setIsFromCache(result.fromCache);
      setError(null);
    } catch (err) {
      console.error('Error in useMempoolStats hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      // Keep the previous data if it exists
      setData(prevData => prevData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval for refreshing
    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  // Debug logging
  useEffect(() => {
    console.log('MempoolStats hook state:', { data, error, loading, isFromCache });
  }, [data, error, loading, isFromCache]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isFromCache
  };
};

export default useMempoolStats; 