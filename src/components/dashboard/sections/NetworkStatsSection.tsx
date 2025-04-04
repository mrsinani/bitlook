
import React from 'react';
import LineChart from '@/components/dashboard/charts/LineChart';
import BarChart from '@/components/dashboard/charts/BarChart';
import CountdownTimer from '@/components/dashboard/CountdownTimer';

interface NetworkStatsSectionProps {
  gasFeeChartData: any;
  tpsChartData: any;
  nextHalvingDate: Date;
}

const NetworkStatsSection: React.FC<NetworkStatsSectionProps> = ({
  gasFeeChartData,
  tpsChartData,
  nextHalvingDate
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
      <div className="lg:col-span-2">
        <LineChart 
          title="Bitcoin Network Gas Fees (24h)"
          data={gasFeeChartData}
        />
      </div>
      <div className="xl:col-span-1">
        <BarChart
          title="Transactions Per Second (TPS)"
          data={tpsChartData}
        />
      </div>
      <div className="xl:col-span-1">
        <CountdownTimer targetDate={nextHalvingDate} />
      </div>
    </div>
  );
};

export default NetworkStatsSection;
