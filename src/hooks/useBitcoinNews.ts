import { useState, useEffect } from 'react';
import { fetchBitcoinNews } from '../services/api';

export interface NewsItem {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Interface for the hook's return value
export interface BitcoinNewsHook {
  data: NewsItem[] | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

/**
 * Hook for fetching Bitcoin news
 * @param refreshInterval - Interval in milliseconds to refresh the data (default: 15 minutes)
 * @returns An object containing the data, loading state, error, and refetch function
 */
const useBitcoinNews = (refreshInterval = 900000): BitcoinNewsHook => {
  const [data, setData] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const result = await fetchBitcoinNews(forceRefresh);
      setData(result.news);
      setIsFromCache(result.fromCache);
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinNews hook:', err);
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
    console.log('BitcoinNews hook state:', { data, error, loading, isFromCache });
  }, [data, error, loading, isFromCache]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isFromCache
  };
};

export default useBitcoinNews; 