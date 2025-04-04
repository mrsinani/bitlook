
import React from 'react';
import { Bitcoin, MessageSquare, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="flex items-center justify-between py-4 px-6 bg-background/70 backdrop-blur-md sticky top-0 z-10 border-b border-border">
      <div className="flex items-center gap-2">
        <Bitcoin className="h-6 w-6 text-bitcoin" />
        <span className="text-2xl font-bold tracking-tight">
          <span className="text-bitcoin">Bit</span>look
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="hidden md:flex items-center gap-2" size="sm">
          Login
        </Button>
        <Button className="bg-gradient-to-r from-bitcoin to-amber-500 hover:from-bitcoin/90 hover:to-amber-500/90 text-white">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
        <Button variant="outline" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-bitcoin rounded-full"></span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
