
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  title?: string;
  targetDate: Date;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  title = 'Countdown to Next Halving',
  targetDate,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={cn("data-card", className)}>
      <div className="card-heading mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{title}</span>
      </div>
      
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="flex flex-col">
          <div className="text-3xl font-bold animate-pulse-slow">{formatNumber(timeLeft.days)}</div>
          <div className="text-xs text-muted-foreground mt-1">Days</div>
        </div>
        
        <div className="flex flex-col">
          <div className="text-3xl font-bold animate-pulse-slow">{formatNumber(timeLeft.hours)}</div>
          <div className="text-xs text-muted-foreground mt-1">Hours</div>
        </div>
        
        <div className="flex flex-col">
          <div className="text-3xl font-bold animate-pulse-slow">{formatNumber(timeLeft.minutes)}</div>
          <div className="text-xs text-muted-foreground mt-1">Minutes</div>
        </div>
        
        <div className="flex flex-col">
          <div className="text-3xl font-bold animate-pulse-slow">{formatNumber(timeLeft.seconds)}</div>
          <div className="text-xs text-muted-foreground mt-1">Seconds</div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Est. Date: {targetDate.toLocaleDateString()}
      </div>
    </div>
  );
};

export default CountdownTimer;
