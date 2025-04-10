import { useState, useEffect } from 'react';
import { fetchFearGreedIndex } from '../services/api';

// Interface for the hook's return value
export interface FearGreedIndexHook {
  data: FearGreedIndexData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

// Interface for the data returned from the API
export interface FearGreedIndexData {
  value: number;
  valueClassification: string;
  timestamp: number;
  timeUntilUpdate: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

/**
 * Hook for fetching Bitcoin Fear and Greed Index data
 * @param refreshInterval - Interval in milliseconds to refresh the data (default: 5 minutes)
 * @returns An object containing the data, loading state, error, and refetch function
 */
const useFearGreedIndex = (refreshInterval = 300000): FearGreedIndexHook => {
  const [data, setData] = useState<FearGreedIndexData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const result = await fetchFearGreedIndex(forceRefresh);
      setData(result);
      setIsFromCache(result.fromCache);
      setError(null);
    } catch (err) {
      console.error('Error in useFearGreedIndex hook:', err);
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
    console.log('FearGreedIndex hook state:', { data, error, loading, isFromCache });
  }, [data, error, loading, isFromCache]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isFromCache
  };
};

export default useFearGreedIndex; 