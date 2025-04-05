import React from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const WelcomeScreen = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Bitlook
          </h1>
          <p className="text-lg text-muted-foreground">
            Your personal Bitcoin analytics dashboard with detailed metrics and
            insights.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          <SignInButton mode="modal">
            <Button variant="default" className="w-full">
              Sign In
            </Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button variant="outline" className="w-full">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
