import { useState, useEffect } from "react";
import { fetchBitcoinHistory } from "../services/api";

interface BitcoinHistoryData {
  data: Array<{
    time: number;
    USD: number;
  }>;
  lastUpdated: Date;
  fromCache: boolean;
  isFallback?: boolean;
}

interface BitcoinHistoryHook {
  data: BitcoinHistoryData | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  isFromCache: boolean;
  chartData: any;
}

export const useBitcoinHistory = (
  refreshInterval = 300000
): BitcoinHistoryHook => {
  const [data, setData] = useState<BitcoinHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: "Bitcoin Price (USD)",
        data: [],
        borderColor: "#F7931A",
        backgroundColor: "rgba(247, 147, 26, 0.2)",
      },
    ],
  });

  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator if we don't already have data
      if (!data) {
        setLoading(true);
      }

      console.log("Fetching Bitcoin history data, forceRefresh:", forceRefresh);
      const historyData = await fetchBitcoinHistory(forceRefresh);
      console.log("Received Bitcoin history data:", historyData);

      setData(historyData);
      setIsFromCache(!!historyData.fromCache);

      // Process data for chart
      if (historyData.data && historyData.data.length > 0) {
        // Sort data by time in ascending order
        const sortedData = [...historyData.data].sort(
          (a, b) => a.time - b.time
        );

        // Group data by hour and take only one point per hour
        const hourlyData = new Map();
        for (const item of sortedData) {
          const date = new Date(item.time * 1000);
          const hourKey = `${date.getFullYear()}-${
            date.getMonth() + 1
          }-${date.getDate()}-${date.getHours()}`;

          // Only keep the most recent data point for each hour
          hourlyData.set(hourKey, item);
        }

        // Convert back to array and sort
        const hourlyArray = Array.from(hourlyData.values()).sort(
          (a, b) => a.time - b.time
        );

        // Take only the most recent 12 hours of data
        const recentData = hourlyArray.slice(-12);

        // Format dates for chart labels
        const labels = recentData.map((item) => {
          const date = new Date(item.time * 1000);
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        });

        // Extract price values
        const prices = recentData.map((item) => item.USD);

        // Update chart data
        setChartData({
          labels: labels,
          datasets: [
            {
              label: "Bitcoin Price (USD)",
              data: prices,
              borderColor: "#F7931A",
              backgroundColor: "rgba(247, 147, 26, 0.2)",
              tension: 0.1, // Adds a slight curve to the line
              pointRadius: 6, // Make points more visible
            },
          ],
        });
      }

      // Clear any previous errors if we got data successfully
      setError(null);
    } catch (err) {
      console.error("Error in useBitcoinHistory hook:", err);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );

      // If we already have data, keep using it and mark as cached
      if (data) {
        console.log("Keeping existing history data after error");
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
    isFromCache,
    chartData,
  };
};

export default useBitcoinHistory;
