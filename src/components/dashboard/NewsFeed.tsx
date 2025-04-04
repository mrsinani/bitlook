
import React from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';

interface NewsItem {
  title: string;
  source: string;
  url: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsFeedProps {
  className?: string;
  newsItems?: NewsItem[];
}

// Sample news data
const sampleNews: NewsItem[] = [
  {
    title: "Bitcoin Breaks $70,000 as Institutional Adoption Grows",
    source: "CoinDesk",
    url: "#",
    timestamp: "2h ago",
    sentiment: "positive"
  },
  {
    title: "New Lightning Network Upgrade Increases Transaction Capacity",
    source: "Bitcoin Magazine",
    url: "#",
    timestamp: "4h ago",
    sentiment: "positive"
  },
  {
    title: "Regulatory Concerns Grow as Bitcoin Mining Energy Use Increases",
    source: "CryptoPanic",
    url: "#",
    timestamp: "6h ago",
    sentiment: "negative"
  },
  {
    title: "Bitcoin Mempool Congestion Leads to Higher Transaction Fees",
    source: "BitcoinNews",
    url: "#",
    timestamp: "12h ago",
    sentiment: "negative"
  },
  {
    title: "Bitcoin Conference Announces Record Attendance for 2025",
    source: "CoinTelegraph",
    url: "#",
    timestamp: "1d ago",
    sentiment: "neutral"
  },
];

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="h-4 w-4 text-positive" />;
    case 'negative':
      return <ThumbsDown className="h-4 w-4 text-negative" />;
    default:
      return null;
  }
};

const NewsFeed: React.FC<NewsFeedProps> = ({ className, newsItems = sampleNews }) => {
  return (
    <div className={cn("data-card", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="card-heading">Bitcoin News Feed</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      
      <div className="space-y-4">
        {newsItems.map((item, index) => (
          <div key={index} className="border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium mb-1 hover:text-primary transition-colors">
                  <a href={item.url} className="flex items-center group">
                    {item.title}
                    <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </h4>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.source}</span>
                  <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
              
              {getSentimentIcon(item.sentiment)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
