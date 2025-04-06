import React from "react";
import LineChart from "@/components/dashboard/charts/LineChart";
import LightningStats from "@/components/LightningStats";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

interface LightningNetworkSectionProps {
  priceChartData: any;
  isLoading?: boolean;
}

const LightningNetworkSection: React.FC<LightningNetworkSectionProps> = ({
  priceChartData,
  isLoading = false,
}) => {
  // Fallback UI for metric cards when they error
  const metricErrorFallback = (title: string) => (
    <div className="w-full h-full p-4 bg-white rounded-lg border shadow-sm">
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <div className="text-red-500 text-sm">
        Failed to load data. Please check your connection and try again.
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
      <div className="xl:col-span-1">
        <ErrorBoundary fallback={metricErrorFallback("Lightning Network")}>
          <LightningStats refreshInterval={300000} />
        </ErrorBoundary>
      </div>
      {isLoading ? (
        <div className="xl:col-span-3 p-4 bg-white rounded-lg border shadow-sm flex flex-col">
          <h3 className="font-medium text-lg mb-2">Bitcoin Price (12 Hours)</h3>
          <div className="flex-grow flex items-center justify-center">
            <div className="w-full h-[300px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          </div>
        </div>
      ) : (
        <LineChart
          title="Bitcoin Price (12 Hours)"
          data={priceChartData}
          className="xl:col-span-3"
        />
      )}
    </div>
  );
};

export default LightningNetworkSection;
