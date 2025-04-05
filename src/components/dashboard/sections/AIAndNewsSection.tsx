import React from 'react';
import ChatbotUI from '@/components/dashboard/ChatbotUI';
import NewsFeed from '@/components/dashboard/NewsFeed';
import ErrorBoundary from '@/components/ErrorBoundary';

const AIAndNewsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChatbotUI className="lg:col-span-1 min-h-[400px]" />
      <ErrorBoundary fallback={
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-full flex flex-col justify-center items-center min-h-[400px]">
          <h3 className="text-lg font-semibold mb-2">Bitcoin News</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Unable to load news feed
          </p>
        </div>
      }>
        <NewsFeed className="lg:col-span-1 min-h-[400px]" refreshInterval={900000} />
      </ErrorBoundary>
    </div>
  );
};

export default AIAndNewsSection;
