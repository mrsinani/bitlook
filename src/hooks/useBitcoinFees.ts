import { useState, useEffect } from 'react';
import { fetchBitcoinFees } from '../services/api';

interface BitcoinFeesData {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinFeesHook {
  data: BitcoinFeesData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

export const useBitcoinFees = (refreshInterval = 60000): BitcoinFeesHook => {
  const [data, setData] = useState<BitcoinFeesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching Bitcoin fees data, forceRefresh:', forceRefresh);
      const feesData = await fetchBitcoinFees(forceRefresh);
      console.log('Received Bitcoin fees data:', feesData);
      
      setData(feesData);
      setIsFromCache(feesData.fromCache);
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinFees hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log('Keeping existing fees data after error');
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

export default useBitcoinFees; 