
import React from 'react';
import NetworkStatsCard from '@/components/dashboard/NetworkStatsCard';
import LineChart from '@/components/dashboard/charts/LineChart';
import { Network, ArrowRight, Zap, CircleDollarSign } from 'lucide-react';

interface LightningNetworkSectionProps {
  priceChartData: any;
}

const LightningNetworkSection: React.FC<LightningNetworkSectionProps> = ({
  priceChartData
}) => {
  // Lightning Network stats
  const lightningNetworkStats = [
    { name: 'Nodes', value: '17,834', icon: Network },
    { name: 'Channels', value: '85,326', icon: ArrowRight },
    { name: 'Capacity', value: '5,231 BTC', icon: Zap },
    { name: 'Avg Fee Rate', value: '0.0001%', icon: CircleDollarSign },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
      <NetworkStatsCard
        title="Lightning Network Stats"
        stats={lightningNetworkStats}
        className="xl:col-span-1"
      />
      <LineChart
        title="Bitcoin Price (6 Months)"
        data={priceChartData}
        className="xl:col-span-3"
      />
    </div>
  );
};

export default LightningNetworkSection;
