import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  className?: string;
  height?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  className,
  height = "h-[300px]",
}) => {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 6, // Default radius when not hovered
        hoverRadius: 10, // Radius when hovered
        hitRadius: 12, // Additional invisible hit area for better hover detection
        borderWidth: 2, // Border width for better visibility
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#FFFFFF",
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(13, 17, 23, 0.8)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#FFFFFF",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#FFFFFF",
        },
      },
    },
  };

  return (
    <div className={cn("data-card", className)}>
      <h3 className="card-heading mb-4">{title}</h3>
      <div className={cn("relative", height)}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default LineChart;
