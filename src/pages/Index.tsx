
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import LineChart from '@/components/dashboard/charts/LineChart';
import BarChart from '@/components/dashboard/charts/BarChart';
import PieChart from '@/components/dashboard/charts/PieChart';
import GaugeChart from '@/components/dashboard/charts/GaugeChart';
import NewsFeed from '@/components/dashboard/NewsFeed';
import ChatbotUI from '@/components/dashboard/ChatbotUI';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import NetworkStatsCard from '@/components/dashboard/NetworkStatsCard';
import {
  Bitcoin,
  CircleDollarSign,
  Database,
  ArrowUpRight,
  GaugeCircle,
  Zap,
  ArrowRight,
  Network
} from 'lucide-react';

const Index = () => {
  // Sample data for charts
  const priceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bitcoin Price (USD)',
        data: [42000, 45000, 48000, 51000, 49000, 52000],
        borderColor: '#F7931A',
        backgroundColor: 'rgba(247, 147, 26, 0.2)',
      },
    ],
  };

  const gasFeeChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Gas Fees (sats/vB)',
        data: [15, 18, 22, 19, 24, 21],
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
      },
    ],
  };

  const tpsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Transactions Per Second',
        data: [5, 4.2, 6.1, 5.8, 7.2, 6.5, 5.9],
        backgroundColor: ['#4ECDC4'],
      },
    ],
  };

  const whaleDistributionData = {
    labels: ['> 10,000 BTC', '1,000-10,000 BTC', '100-1,000 BTC', '10-100 BTC', '< 10 BTC'],
    datasets: [
      {
        data: [15, 23, 32, 20, 10],
        backgroundColor: [
          '#F7931A',
          '#FFB74D',
          '#FFF176',
          '#4ECDC4',
          '#81C784',
        ],
        borderColor: [
          'rgba(247, 147, 26, 0.8)',
          'rgba(255, 183, 77, 0.8)',
          'rgba(255, 241, 118, 0.8)',
          'rgba(78, 205, 196, 0.8)',
          'rgba(129, 199, 132, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const exchangeReserveData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Exchange Reserve (BTC)',
        data: [2100000, 2050000, 1980000, 1920000, 1890000, 1850000],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
      },
    ],
  };

  const fundingRateData = {
    labels: ['Binance', 'FTX', 'Bybit', 'OKX', 'Deribit'],
    datasets: [
      {
        label: 'Funding Rate (%)',
        data: [0.01, -0.005, 0.02, -0.01, 0.015],
        backgroundColor: [
          '#4ECDC4',
          '#FF6B6B',
          '#4ECDC4',
          '#FF6B6B',
          '#4ECDC4',
        ],
      },
    ],
  };

  // Sample Lightning Network stats
  const lightningNetworkStats = [
    { name: 'Nodes', value: '17,834', icon: Network },
    { name: 'Channels', value: '85,326', icon: ArrowRight },
    { name: 'Capacity', value: '5,231 BTC', icon: Zap },
    { name: 'Avg Fee Rate', value: '0.0001%', icon: CircleDollarSign },
  ];

  // Date for the next Bitcoin halving (approximate)
  const nextHalvingDate = new Date('2025-04-20T00:00:00');

  return (
    <DashboardLayout>
      {/* Top Row - Live Metrics */}
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
      
      {/* Second Row - Network Stats */}
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
      
      {/* Third Row - Whale & Sentiment Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-1">
          <PieChart
            title="Whale Distribution"
            data={whaleDistributionData}
          />
        </div>
        <div className="xl:col-span-1">
          <LineChart
            title="Exchange Reserve"
            data={exchangeReserveData}
          />
        </div>
        <div className="xl:col-span-1">
          <GaugeChart
            title="Fear & Greed Index"
            value={75}
            min={0}
            max={100}
          />
        </div>
        <div className="xl:col-span-1">
          <BarChart
            title="Funding Rate"
            data={fundingRateData}
          />
        </div>
      </div>
      
      {/* Bottom Section - AI & News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatbotUI className="lg:col-span-1 min-h-[400px]" />
        <NewsFeed className="lg:col-span-1 min-h-[400px]" />
      </div>
    </DashboardLayout>
  );
};

export default Index;
