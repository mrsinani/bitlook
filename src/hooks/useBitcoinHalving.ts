import { useState, useEffect } from 'react';
import { fetchBitcoinHalving } from '../services/api';

interface BitcoinHalvingData {
  currentHeight: number;
  nextHalvingBlock: number;
  blocksRemaining: number;
  estimatedDaysRemaining: number;
  estimatedHalvingDate: Date;
  currentReward: number;
  nextReward: number;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinHalvingHook {
  data: BitcoinHalvingData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

export const useBitcoinHalving = (refreshInterval = 300000): BitcoinHalvingHook => {
  const [data, setData] = useState<BitcoinHalvingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Function to calculate time remaining from estimated halving date
  const calculateTimeRemaining = (halvingDate: Date) => {
    const now = new Date();
    const difference = halvingDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  // Fetch halving data from API
  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }
      
      console.log('Fetching Bitcoin halving data, forceRefresh:', forceRefresh);
      const halvingData = await fetchBitcoinHalving(forceRefresh);
      console.log('Received Bitcoin halving data:', halvingData);
      
      setData(halvingData);
      setIsFromCache(halvingData.fromCache);
      
      // Calculate time remaining based on estimated halving date
      if (halvingData.estimatedHalvingDate) {
        setTimeRemaining(calculateTimeRemaining(halvingData.estimatedHalvingDate));
      }
      
      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error('Error in useBitcoinHalving hook:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log('Keeping existing halving data after error');
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update time remaining every second
  useEffect(() => {
    if (!data || !data.estimatedHalvingDate) return;
    
    const updateTimeRemaining = () => {
      setTimeRemaining(calculateTimeRemaining(data.estimatedHalvingDate));
    };
    
    const intervalId = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(intervalId);
  }, [data]);

  // Fetch data at specified interval
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
    timeRemaining
  };
};

export default useBitcoinHalving; 