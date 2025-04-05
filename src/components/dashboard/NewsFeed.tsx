import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, ThumbsUp, ThumbsDown, RefreshCw, DatabaseIcon, AlertCircle, AlertTriangle } from 'lucide-react';
import useBitcoinNews, { NewsItem } from '@/hooks/useBitcoinNews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsFeedProps {
  className?: string;
  refreshInterval?: number;
}

// Format relative time
const formatRelativeTime = (publishedAt: string): string => {
  try {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffMs = now.getTime() - published.getTime();
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    
    // If more than a week, just return the date
    return published.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

const getSentimentIcon = (sentiment?: string) => {
  if (!sentiment) return null;
  
  switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case 'negative':
      return <ThumbsDown className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

const NewsFeed: React.FC<NewsFeedProps> = ({ className, refreshInterval = 900000 }) => {
  const { data: newsItems, loading, error, refetch, isFromCache } = useBitcoinNews(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch(true);
    } catch (error) {
      console.error('Error refreshing news data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Check if we're showing fallback data
  const isShowingFallback = newsItems && newsItems.length > 0 && 
    newsItems[0].source === 'Offline Cache';
  
  return (
    <div className={cn("data-card", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="card-heading">Bitcoin News Feed</h3>
        <div className="flex items-center space-x-2">
          {isFromCache && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              <DatabaseIcon className="h-3 w-3 mr-1" />
              Cached
            </Badge>
          )}
          {isShowingFallback && (
            <Badge variant="outline" className="text-orange-500 border-orange-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {loading && !newsItems ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-2xl font-bold">Loading news...</div>
        </div>
      ) : error && !newsItems ? (
        <div className="text-red-500 p-4 border border-red-300 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p>Error loading news data.</p>
          </div>
          <p className="text-xs mt-1">
            {error.message || "API may be temporarily unavailable."}
          </p>
        </div>
      ) : newsItems && newsItems.length > 0 ? (
        <div className="space-y-4">
          {newsItems.map((item, index) => (
            <div key={index} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium mb-1 hover:text-primary transition-colors">
                    <a href={item.url} className="flex items-center group" target="_blank" rel="noopener noreferrer">
                      {item.title}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </h4>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.source}</span>
                    <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
                    <span>{formatRelativeTime(item.publishedAt)}</span>
                  </div>
                </div>
                
                {getSentimentIcon(item.sentiment)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-10">
          No Bitcoin news found. Try refreshing.
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
