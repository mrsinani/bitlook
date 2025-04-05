import { useState, useEffect } from 'react';
import { fetchBitcoinPrice } from '../services/api';

interface BitcoinPriceData {
  price: number;
  formattedPrice: string;
  lastUpdated: Date;
  fromCache?: boolean;
  isFallback?: boolean;
}

interface BitcoinPriceHook {
  data: BitcoinPriceData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

export const useBitcoinPrice = (refreshInterval = 60000): BitcoinPriceHook => {
  const [data, setData] = useState<BitcoinPriceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const priceData = await fetchBitcoinPrice(forceRefresh);
      
      setData(priceData);
      setIsFromCache(!!priceData.fromCache);
      setError(null);
      
      if (priceData.isFallback) {
        // Log that we're using fallback data, but don't set an error
        // This allows us to show the UI with fallback data
        console.warn('Using fallback Bitcoin price data');
      }
    } catch (err) {
      console.error('Error in useBitcoinPrice hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      // Don't clear existing data on error - show stale data with error indication
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately
    fetchData();

    // Set up interval for refreshing
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => fetchData(), refreshInterval);
      
      // Cleanup interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval]);

  return { data, loading, error, refetch: fetchData, isFromCache };
};

export default useBitcoinPrice; 