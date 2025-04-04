
import React from 'react';
import ChatbotUI from '@/components/dashboard/ChatbotUI';
import NewsFeed from '@/components/dashboard/NewsFeed';

const AIAndNewsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChatbotUI className="lg:col-span-1 min-h-[400px]" />
      <NewsFeed className="lg:col-span-1 min-h-[400px]" />
    </div>
  );
};

export default AIAndNewsSection;
