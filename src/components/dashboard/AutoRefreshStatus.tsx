import React from "react";
import { useAutoRefresh } from "@/context/AutoRefreshContext";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock } from "lucide-react";

interface AutoRefreshStatusProps {
  className?: string;
}

const AutoRefreshStatus: React.FC<AutoRefreshStatusProps> = ({ className }) => {
  const {
    isAutoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    isRefreshing,
    lastRefreshTime,
  } = useAutoRefresh();

  // Format the last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return "Never";

    // If within the last minute, show "Just now"
    const now = new Date();
    const secondsAgo = Math.floor(
      (now.getTime() - lastRefreshTime.getTime()) / 1000
    );
    if (secondsAgo < 60) {
      return `${secondsAgo}s ago`;
    }

    // Otherwise show the time
    return lastRefreshTime.toLocaleTimeString();
  };

  if (!isAutoRefreshEnabled) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge
        variant="outline"
        className="flex items-center gap-1 text-xs"
        onClick={() => setAutoRefreshEnabled(!isAutoRefreshEnabled)}
      >
        <RefreshCw
          className={`h-3 w-3 ${
            isRefreshing ? "animate-spin text-amber-500" : ""
          }`}
        />
        <span>Auto-refresh: {(refreshInterval / 1000).toFixed(0)}s</span>
      </Badge>

      {lastRefreshTime && (
        <span className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last: {formatLastRefreshTime()}
        </span>
      )}
    </div>
  );
};

export default AutoRefreshStatus;
