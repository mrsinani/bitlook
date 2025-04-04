
import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon: Icon,
  className,
  children
}) => {
  return (
    <div className={cn("data-card", className)}>
      <div className="card-heading mb-4 flex justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span>{title}</span>
        </div>
      </div>
      
      <div className="h-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
