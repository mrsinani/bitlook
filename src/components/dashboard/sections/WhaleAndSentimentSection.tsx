import React from "react";
import PieChart from "@/components/dashboard/charts/PieChart";
import LineChart from "@/components/dashboard/charts/LineChart";
import GaugeChart from "@/components/dashboard/charts/GaugeChart";
import BarChart from "@/components/dashboard/charts/BarChart";

interface WhaleAndSentimentSectionProps {
  whaleDistributionData: any;
  exchangeReserveData: any;
  fundingRateData: any;
}

const WhaleAndSentimentSection: React.FC<WhaleAndSentimentSectionProps> = ({
  whaleDistributionData,
  exchangeReserveData,
  fundingRateData,
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
        <GaugeChart
          title="Fear & Greed Index"
          value={75}
          min={0}
          max={100}
          height="h-[300px]"
          className="h-full"
        />
      </div>
      <div className="xl:col-span-1">
        <BarChart
          title="Funding Rate"
          data={fundingRateData}
          height="h-[300px]"
          className="h-full"
        />
      </div>
    </div>
  );
};

export default WhaleAndSentimentSection;
