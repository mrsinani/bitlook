import React from "react";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  title: string;
  value: number;
  min: number;
  max: number;
  className?: string;
  height?: string;
  segments?: {
    color: string;
    label: string;
    range: [number, number];
  }[];
}

const defaultSegments = [
  { color: "bg-negative", label: "Fear", range: [0, 33] },
  { color: "bg-amber-500", label: "Neutral", range: [33, 66] },
  { color: "bg-positive", label: "Greed", range: [66, 100] },
];

const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  min,
  max,
  className,
  height = "h-[300px]",
  segments = defaultSegments,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const rotationDegree = percentage * 1.8 - 90; // 180 degrees for the gauge, -90 to start at left

  // Determine which segment the value falls into
  const currentSegment = segments.find(
    (segment) =>
      percentage >= segment.range[0] && percentage <= segment.range[1]
  );

  return (
    <div className={cn("data-card flex flex-col", className)}>
      <h3 className="card-heading mb-4">{title}</h3>

      <div
        className={cn(
          "flex flex-col items-center justify-center flex-1",
          height
        )}
      >
        <div className="relative w-40 h-20 overflow-hidden">
          <div className="absolute w-40 h-40 rounded-full border-[15px] border-muted top-0 left-0"></div>

          {segments.map((segment, index) => {
            const startAngle = -90 + segment.range[0] * 1.8;
            const endAngle = -90 + segment.range[1] * 1.8;
            const angleRange = endAngle - startAngle;

            return (
              <div
                key={index}
                className={cn(
                  "absolute w-40 h-40 rounded-full border-[15px] top-0 left-0",
                  segment.color
                )}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + 50 * Math.cos((endAngle * Math.PI) / 180)
                  }% ${50 + 50 * Math.sin((endAngle * Math.PI) / 180)}%, ${
                    50 + 50 * Math.cos((startAngle * Math.PI) / 180)
                  }% ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}%)`,
                }}
              ></div>
            );
          })}

          <div
            className="absolute w-3 h-20 bg-white left-1/2 bottom-0 origin-bottom transform -translate-x-1/2"
            style={{
              transform: `translateX(-50%) rotate(${rotationDegree}deg)`,
            }}
          ></div>

          <div className="absolute w-6 h-6 bg-white rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 border-4 border-background"></div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-3xl font-bold">{value}</div>
          <div
            className={cn(
              "text-sm mt-1",
              currentSegment?.color.replace("bg-", "text-")
            )}
          >
            {currentSegment?.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;
