
import React, { ReactNode } from 'react';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
