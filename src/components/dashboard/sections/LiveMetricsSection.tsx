
import React from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import { Bitcoin, CircleDollarSign, Database, ArrowUpRight } from 'lucide-react';

const LiveMetricsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Bitcoin Price"
        value="$68,542"
        change={{ value: "2.3%", positive: true }}
        icon={Bitcoin}
      />
      <MetricCard
        title="Market Cap"
        value="$1.32T"
        change={{ value: "1.8%", positive: true }}
        icon={CircleDollarSign}
      />
      <MetricCard
        title="Circulating Supply"
        value="19.42M BTC"
        icon={Database}
      />
      <MetricCard
        title="Blockchain Height"
        value="842,517"
        change={{ value: "+72 blocks", positive: true }}
        icon={ArrowUpRight}
      />
    </div>
  );
};

export default LiveMetricsSection;
