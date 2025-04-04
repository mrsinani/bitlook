
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NetworkStat {
  name: string;
  value: string | number;
  icon?: LucideIcon;
}

interface NetworkStatsCardProps {
  title: string;
  stats: NetworkStat[];
  className?: string;
}

const NetworkStatsCard: React.FC<NetworkStatsCardProps> = ({ title, stats, className }) => {
  return (
    <div className={cn("data-card", className)}>
      <h3 className="card-heading mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {stat.icon && <stat.icon className="h-4 w-4" />}
              <span>{stat.name}</span>
            </div>
            <div className="text-xl font-medium">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkStatsCard;
