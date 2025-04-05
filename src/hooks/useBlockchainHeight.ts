import { useState, useEffect, useRef } from 'react';
import { fetchBlockchainHeight } from '../services/api';

interface BlockchainHeightData {
  height: number;
  formattedHeight: string;
  lastUpdated: Date;
  fromCache: boolean;
}

interface BlockchainHeightHook {
  data: BlockchainHeightData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
  previousHeight: number | null;
}

export const useBlockchainHeight = (refreshInterval = 30000): BlockchainHeightHook => {
  const [data, setData] = useState<BlockchainHeightData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const previousHeightRef = useRef<number | null>(null);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      const heightData = await fetchBlockchainHeight(forceRefresh);
      
      // Store previous height before updating
      if (data?.height) {
        previousHeightRef.current = data.height;
      }
      
      setData(heightData);
      setIsFromCache(heightData.fromCache);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
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
    previousHeight: previousHeightRef.current
  };
};

export default useBlockchainHeight; 