import { useState, useEffect } from 'react';
import { fetchBitcoinSupply } from '../services/api';

interface BitcoinSupplyData {
  circulatingSupply: number;
  formattedCirculatingSupply: string;
  maxSupply: number;
  percentMined: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinSupplyHook {
  data: BitcoinSupplyData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

export const useBitcoinSupply = (refreshInterval = 60000): BitcoinSupplyHook => {
  const [data, setData] = useState<BitcoinSupplyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching supply data, forceRefresh:', forceRefresh);
      const supplyData = await fetchBitcoinSupply(forceRefresh);
      console.log('Received supply data:', supplyData);
      
      setData(supplyData);
      setIsFromCache(supplyData.fromCache);
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinSupply hook:', err);
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

export default useBitcoinSupply; 