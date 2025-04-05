import React, { ComponentType } from "react";
import useAutoRefreshable from "./useAutoRefreshable";

// Define the shape of props required for a component to be auto-refreshable
interface AutoRefreshableProps {
  isFromCache: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

/**
 * Higher-Order Component that adds auto-refresh capability to any component
 * that has isFromCache and refetch props.
 *
 * @param WrappedComponent Component to enhance with auto-refresh capability
 * @param componentId Unique identifier for the component
 */
export function withAutoRefresh<P extends AutoRefreshableProps>(
  WrappedComponent: ComponentType<P>,
  componentId: string
) {
  // Return a new component with auto-refresh capability
  return (props: P) => {
    const { isFromCache, refetch } = props;

    // Register this component for auto-refresh when cached
    useAutoRefreshable(
      async () => {
        try {
          await refetch(true);
        } catch (error) {
          console.error(`Error auto-refreshing ${componentId}:`, error);
        }
      },
      isFromCache,
      componentId
    );

    // Render the original component with all its original props
    return <WrappedComponent {...props} />;
  };
}

export default withAutoRefresh;
