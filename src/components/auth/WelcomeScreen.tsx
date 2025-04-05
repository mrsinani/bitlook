import React, { useState, useEffect } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";

const WelcomeScreen = () => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full mx-auto text-center space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold tracking-tight">
            {showText && (
              <>
                <span className="text-bitcoin">
                  <TypeAnimation
                    sequence={["", 400, "B", 100, "Bi", 100, "Bit"]}
                    cursor={false}
                    repeat={0}
                    speed={50}
                  />
                </span>
                <TypeAnimation
                  sequence={["", 800, "l", 100, "lo", 100, "loo", 100, "look"]}
                  cursor={true}
                  repeat={0}
                  speed={50}
                />
              </>
            )}
          </h1>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
