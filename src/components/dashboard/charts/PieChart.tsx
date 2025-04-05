import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  className?: string;
  height?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  className,
  height = "h-[300px]",
}) => {
  const { theme } = useTheme();
  const [chartOptions, setChartOptions] = useState<ChartOptions<"pie">>();

  useEffect(() => {
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right" as const,
          labels: {
            color: theme === "light" ? "#000000" : "#FFFFFF",
            padding: 15,
            font: {
              size: 12,
            },
          },
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
    });
  }, [theme]);

  if (!chartOptions) return null;

  return (
    <div className={cn("data-card", className)}>
      <h3 className="card-heading mb-4">{title}</h3>
      <div className={cn("relative flex justify-center", height)}>
        <Pie options={chartOptions} data={data} />
      </div>
    </div>
  );
};

export default PieChart;
