import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string | string[];
    }[];
  };
  className?: string;
  height?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  className,
  height = "h-[300px]",
}) => {
  const { theme } = useTheme();
  const [chartOptions, setChartOptions] = useState<ChartOptions<"bar">>();

  useEffect(() => {
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: theme === "light" ? "#000000" : "#FFFFFF",
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor:
            theme === "light"
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(13, 17, 23, 0.8)",
          titleColor: theme === "light" ? "#000000" : "#FFFFFF",
          bodyColor: theme === "light" ? "#000000" : "#FFFFFF",
          borderColor:
            theme === "light"
              ? "rgba(0, 0, 0, 0.1)"
              : "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: {
            color:
              theme === "light"
                ? "rgba(0, 0, 0, 0.05)"
                : "rgba(255, 255, 255, 0.05)",
          },
          ticks: {
            color: theme === "light" ? "#000000" : "#FFFFFF",
          },
        },
        y: {
          grid: {
            color:
              theme === "light"
                ? "rgba(0, 0, 0, 0.05)"
                : "rgba(255, 255, 255, 0.05)",
          },
          ticks: {
            color: theme === "light" ? "#000000" : "#FFFFFF",
          },
        },
      },
    });
  }, [theme]);

  if (!chartOptions) return null;

  return (
    <div className={cn("data-card", className)}>
      <h3 className="card-heading mb-4">{title}</h3>
      <div className={cn("relative", height)}>
        <Bar options={chartOptions} data={data} />
      </div>
    </div>
  );
};

export default BarChart;
