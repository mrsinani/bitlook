import React from "react";
import PieChart from "@/components/dashboard/charts/PieChart";
import LineChart from "@/components/dashboard/charts/LineChart";
import FearGreedIndex from "@/components/FearGreedIndex";
import FundingRate from "@/components/FundingRate";
import ErrorBoundary from "@/components/ErrorBoundary";

interface WhaleAndSentimentSectionProps {
  whaleDistributionData: any;
  exchangeReserveData: any;
}

const WhaleAndSentimentSection: React.FC<WhaleAndSentimentSectionProps> = ({
  whaleDistributionData,
  exchangeReserveData
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
      <div className="xl:col-span-1">
        <PieChart
          title="Whale Distribution"
          data={whaleDistributionData}
          height="h-[300px]"
          className="h-full"
        />
      </div>
      <div className="xl:col-span-1">
        <LineChart
          title="Exchange Reserve"
          data={exchangeReserveData}
          height="h-[300px]"
          className="h-full"
        />
      </div>
      <div className="xl:col-span-1">
        <ErrorBoundary fallback={
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-full flex flex-col justify-center items-center">
            <h3 className="text-lg font-semibold mb-2">Fear & Greed Index</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Unable to load sentiment data
            </p>
          </div>
        }>
          <FearGreedIndex refreshInterval={600000} />
        </ErrorBoundary>
      </div>
      <div className="xl:col-span-1">
        <ErrorBoundary fallback={
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-full flex flex-col justify-center items-center">
            <h3 className="text-lg font-semibold mb-2">Funding Rate</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Unable to load funding rate data
            </p>
          </div>
        }>
          <FundingRate refreshInterval={180000} />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default WhaleAndSentimentSection;
