import { useState, useEffect } from 'react';
import { fetchBitcoinMarketData } from '../services/api';

interface BitcoinMarketData {
  marketCap: number;
  formattedMarketCap: string;
  volume24h: number;
  formattedVolume: string;
  circulatingSupply: number;
  maxSupply: number;
  priceChange24h: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinMarketDataHook {
  data: BitcoinMarketData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

export const useBitcoinMarketData = (refreshInterval = 60000): BitcoinMarketDataHook => {
  const [data, setData] = useState<BitcoinMarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching market data, forceRefresh:', forceRefresh);
      const marketData = await fetchBitcoinMarketData(forceRefresh);
      console.log('Received market data:', marketData);
      
      setData(marketData);
      setIsFromCache(marketData.fromCache);
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinMarketData hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log('Keeping existing data after error');
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
    isFromCache
  };
};

export default useBitcoinMarketData; 