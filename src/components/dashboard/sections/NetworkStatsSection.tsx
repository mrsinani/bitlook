import React from 'react';
import GasFees from '@/components/GasFees';
import TransactionsPerSecond from '@/components/TransactionsPerSecond';
import HalvingCountdown from '@/components/HalvingCountdown';
import ErrorBoundary from '@/components/ErrorBoundary';

interface NetworkStatsSectionProps {}

const NetworkStatsSection: React.FC<NetworkStatsSectionProps> = () => {
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
    <div className="space-y-6 mb-6">
      {/* Live Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <ErrorBoundary fallback={metricErrorFallback("Gas Fees")}>
            <GasFees refreshInterval={30000} />
          </ErrorBoundary>
        </div>
        <div className="col-span-1">
          <ErrorBoundary fallback={metricErrorFallback("TPS")}>
            <TransactionsPerSecond refreshInterval={30000} />
          </ErrorBoundary>
        </div>
        <div className="col-span-1">
          <ErrorBoundary fallback={metricErrorFallback("Halving Countdown")}>
            <HalvingCountdown refreshInterval={300000} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatsSection;
