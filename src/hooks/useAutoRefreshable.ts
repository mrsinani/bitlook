import { useEffect, useId } from "react";
import { useAutoRefresh } from "../context/AutoRefreshContext";

/**
 * Hook for components to register their refresh functions when they are in a cached state
 *
 * @param refreshFn The function to call when refreshing the component
 * @param isFromCache Whether the component is currently showing cached data
 * @param componentId Optional unique ID for the component (defaults to auto-generated ID)
 */
const useAutoRefreshable = (
  refreshFn: () => Promise<void>,
  isFromCache: boolean,
  componentId?: string
) => {
  const { registerRefreshFunction, unregisterRefreshFunction } =
    useAutoRefresh();
  const autoId = useId();
  const id = componentId || autoId;

  useEffect(() => {
    // Only register for auto-refresh if component is showing cached data
    if (isFromCache) {
      registerRefreshFunction(id, refreshFn);
    } else {
      unregisterRefreshFunction(id);
    }

    // Clean up on unmount
    return () => {
      unregisterRefreshFunction(id);
    };
  }, [
    id,
    isFromCache,
    refreshFn,
    registerRefreshFunction,
    unregisterRefreshFunction,
  ]);

  return {
    // If needed, add additional functionality here
  };
};

export default useAutoRefreshable;
