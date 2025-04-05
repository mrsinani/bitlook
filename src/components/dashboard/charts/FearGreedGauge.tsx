import React from "react";
import GaugeChart from "react-gauge-chart";
import { cn } from "@/lib/utils";

interface FearGreedGaugeProps {
  title: string;
  value: number; // Value from 0 to 100
  className?: string;
  height?: string;
}

const FearGreedGauge: React.FC<FearGreedGaugeProps> = ({
  title,
  value,
  className,
  height = "h-[300px]",
}) => {
  // Calculate normalized value (0-1)
  const normalizedValue = value / 100;

  // Determine the label based on value
  const getLabel = () => {
    if (value <= 50) return "Fear";
    return "Greed";
  };

  // Get color for the current value
  const getTextColor = () => {
    if (value <= 50) return "text-red-600";
    return "text-[#F7931A]";
  };

  return (
    <div className={cn("data-card flex flex-col", className)}>
      <h3 className="card-heading mb-4">{title}</h3>

      <div
        className={cn(
          "flex flex-col items-center justify-center flex-1",
          height
        )}
      >
        <GaugeChart
          id="fear-greed-gauge"
          nrOfLevels={2}
          colors={["#dc2626", "#F7931A"]}
          arcWidth={0.3}
          percent={normalizedValue}
          textColor="#000000"
          hideText={true}
          needleColor="#6b7280"
          needleBaseColor="#6b7280"
        />

        <div className="mt-4 text-center">
          <div className="text-3xl font-bold">{value}</div>
          <div className={cn("text-sm mt-1", getTextColor())}>{getLabel()}</div>
        </div>
      </div>
    </div>
  );
};

export default FearGreedGauge;
