import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AutoRefreshContextType {
  refreshCachedComponents: () => void;
  registerRefreshFunction: (id: string, refreshFn: () => Promise<void>) => void;
  unregisterRefreshFunction: (id: string) => void;
  isAutoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
}

const AutoRefreshContext = createContext<AutoRefreshContextType | undefined>(
  undefined
);

export const useAutoRefresh = () => {
  const context = useContext(AutoRefreshContext);
  if (!context) {
    throw new Error(
      "useAutoRefresh must be used within an AutoRefreshProvider"
    );
  }
  return context;
};

interface AutoRefreshProviderProps {
  children: ReactNode;
  defaultRefreshInterval?: number;
  defaultAutoRefreshEnabled?: boolean;
}

export const AutoRefreshProvider: React.FC<AutoRefreshProviderProps> = ({
  children,
  defaultRefreshInterval = 5000, // 5 seconds default
  defaultAutoRefreshEnabled = true,
}) => {
  const [refreshFunctions, setRefreshFunctions] = useState<
    Record<string, () => Promise<void>>
  >({});
  const [isAutoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(
    defaultAutoRefreshEnabled
  );
  const [refreshInterval, setRefreshInterval] = useState<number>(
    defaultRefreshInterval
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Register a component's refresh function
  const registerRefreshFunction = (
    id: string,
    refreshFn: () => Promise<void>
  ) => {
    setRefreshFunctions((prev) => ({ ...prev, [id]: refreshFn }));
  };

  // Unregister a component's refresh function (e.g., on unmount)
  const unregisterRefreshFunction = (id: string) => {
    setRefreshFunctions((prev) => {
      const newFunctions = { ...prev };
      delete newFunctions[id];
      return newFunctions;
    });
  };

  // Refresh all registered components
  const refreshCachedComponents = async () => {
    // If no components to refresh, don't do anything
    if (Object.keys(refreshFunctions).length === 0) return;

    // Set refreshing state
    setIsRefreshing(true);

    try {
      // Get all refresh functions
      const refreshPromises = Object.values(refreshFunctions).map(
        (refreshFn) => {
          try {
            return refreshFn();
          } catch (error) {
            console.error("Error refreshing component:", error);
            return Promise.resolve();
          }
        }
      );

      // Execute all refresh functions in parallel
      await Promise.all(refreshPromises);

      // Update last refresh time
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      // Reset refreshing state
      setIsRefreshing(false);
    }
  };

  // Set up auto refresh timer
  useEffect(() => {
    if (!isAutoRefreshEnabled || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      refreshCachedComponents();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [isAutoRefreshEnabled, refreshInterval, refreshFunctions]);

  const value: AutoRefreshContextType = {
    refreshCachedComponents,
    registerRefreshFunction,
    unregisterRefreshFunction,
    isAutoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
    isRefreshing,
    lastRefreshTime,
  };

  return (
    <AutoRefreshContext.Provider value={value}>
      {children}
    </AutoRefreshContext.Provider>
  );
};
