
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    positive: boolean;
  };
  icon?: LucideIcon;
  className?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  className,
  isLoading = false
}) => {
  return (
    <div className={cn("data-card", className)}>
      <div className="card-heading">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span>{title}</span>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-28 mb-2"></div>
          {change && <div className="h-5 bg-muted rounded w-16"></div>}
        </div>
      ) : (
        <>
          <div className="card-value">{value}</div>
          
          {change && (
            <div className={cn(
              "text-sm font-medium flex items-center gap-1 mt-1",
              change.positive ? "text-positive" : "text-negative"
            )}>
              {change.positive ? "▲" : "▼"} {change.value}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MetricCard;
