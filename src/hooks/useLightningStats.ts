import { useState, useEffect } from 'react';
import { fetchLightningStats } from '../services/api';

interface LightningStatsData {
  nodeCount: number;
  channelCount: number;
  totalCapacity: {
    btc: number;
    sats: number;
  };
  avgChannelSize: {
    btc: number;
    sats: number;
  };
  medianChannelSize: {
    btc: number;
    sats: number;
  };
  avgChannelsPerNode: number;
  avgNodeCapacity: {
    btc: number;
    sats: number;
  };
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface LightningStatsHook {
  data: LightningStatsData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
}

export const useLightningStats = (refreshInterval = 300000): LightningStatsHook => {
  const [data, setData] = useState<LightningStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching Lightning Network stats, forceRefresh:', forceRefresh);
      const lightningData = await fetchLightningStats(forceRefresh);
      console.log('Received Lightning Network stats:', lightningData);
      
      setData(lightningData);
      setIsFromCache(lightningData.fromCache);
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useLightningStats hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log('Keeping existing Lightning data after error');
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

export default useLightningStats; 