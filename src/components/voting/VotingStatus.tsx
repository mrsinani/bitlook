import { useEffect, useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";

interface VotingStatusProps {
  status: {
    isOpen: boolean;
    endTime: number;
    timeRemaining: number;
  };
}

const VotingStatus = ({ status }: VotingStatusProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(status.timeRemaining);
  const [percentage, setPercentage] = useState<number>(0);

  useEffect(() => {
    if (!status.isOpen) {
      setTimeLeft(0);
      setPercentage(0);
      return;
    }

    // Calculate total duration (assuming from current time to endTime)
    const totalDuration = status.endTime - Math.floor(Date.now() / 1000) + status.timeRemaining;
    const elapsedTime = totalDuration - status.timeRemaining;
    
    // Calculate percentage
    const calculatedPercentage = totalDuration > 0
      ? Math.max(0, Math.min(100, (elapsedTime / totalDuration) * 100))
      : 0;
    
    setPercentage(calculatedPercentage);
    setTimeLeft(status.timeRemaining);

    // Set up interval to count down
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        
        // Recalculate percentage
        const newElapsedTime = totalDuration - (prev - 1);
        const newPercentage = totalDuration > 0
          ? Math.max(0, Math.min(100, (newElapsedTime / totalDuration) * 100))
          : 0;
        
        setPercentage(newPercentage);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status.isOpen, status.endTime, status.timeRemaining]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ended";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      `${secs}s`
    ].filter(Boolean).join(' ');
  };

  if (!status.isOpen) {
    return null; // Don't show the status card if voting is not open
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-sm font-medium">Voting in progress</p>
            <p className="text-sm text-gray-500">{formatTime(timeLeft)}</p>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingStatus; 