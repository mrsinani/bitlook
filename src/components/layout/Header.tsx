import React, { useState } from "react";
import { Bitcoin, Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <>
      <header className="flex items-center justify-between py-4 px-6 bg-background/70 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Bitcoin className="h-6 w-6 text-bitcoin" />
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-bitcoin">Bit</span>look
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton>
              <Button
                variant="ghost"
                className="hidden md:flex items-center gap-2"
                size="sm"
              >
                Login
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-gradient-to-r from-bitcoin to-amber-500 hover:from-bitcoin/90 hover:to-amber-500/90 text-white">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>

          <Button
            variant="outline"
            size="icon"
            className="relative ml-2"
            onClick={toggleSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Header;
