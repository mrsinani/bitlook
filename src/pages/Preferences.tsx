import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define a type for dashboard visibility settings
export type DashboardVisibility = {
  liveMetrics: boolean;
  networkStats: boolean;
  lightningNetwork: boolean;
  whaleAndSentiment: boolean;
  aiAndNews: boolean;
};

// Create a Context for global state management
export const DashboardVisibilityContext = React.createContext<{
  visibility: DashboardVisibility;
  setVisibility: React.Dispatch<React.SetStateAction<DashboardVisibility>>;
}>({
  visibility: {
    liveMetrics: true,
    networkStats: true,
    lightningNetwork: true,
    whaleAndSentiment: true,
    aiAndNews: true,
  },
  setVisibility: () => {},
});

// Default all sections to visible
const defaultVisibility: DashboardVisibility = {
  liveMetrics: true,
  networkStats: true,
  lightningNetwork: true,
  whaleAndSentiment: true,
  aiAndNews: true,
};

const Preferences = () => {
  const { user } = useUser();
  const [visibility, setVisibility] = useState<DashboardVisibility>(() => {
    // Try to load saved preferences from localStorage
    const saved = localStorage.getItem("dashboardVisibility");
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  // Save visibility preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("dashboardVisibility", JSON.stringify(visibility));
  }, [visibility]);

  const handleSavePreferences = () => {
    localStorage.setItem("dashboardVisibility", JSON.stringify(visibility));
    // Show a success message or notification here
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            User Preferences
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize how BitLook appears to you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select defaultValue="system">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="price-update">
                      Real-time price updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable live price data updates
                    </p>
                  </div>
                  <Switch id="price-update" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="animations">UI animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth transitions and animations
                    </p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Layout</CardTitle>
                <CardDescription>
                  Customize which sections appear on your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="live-metrics">Live Metrics</Label>
                    <p className="text-sm text-muted-foreground">
                      Price, market cap, and volume information
                    </p>
                  </div>
                  <Switch
                    id="live-metrics"
                    checked={visibility.liveMetrics}
                    onCheckedChange={(checked) =>
                      setVisibility((prev) => ({
                        ...prev,
                        liveMetrics: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="network-stats">Network Statistics</Label>
                    <p className="text-sm text-muted-foreground">
                      Gas fees, TPS, and halving countdown
                    </p>
                  </div>
                  <Switch
                    id="network-stats"
                    checked={visibility.networkStats}
                    onCheckedChange={(checked) =>
                      setVisibility((prev) => ({
                        ...prev,
                        networkStats: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="lightning-network">Lightning Network</Label>
                    <p className="text-sm text-muted-foreground">
                      Lightning network capacity and channel metrics
                    </p>
                  </div>
                  <Switch
                    id="lightning-network"
                    checked={visibility.lightningNetwork}
                    onCheckedChange={(checked) =>
                      setVisibility((prev) => ({
                        ...prev,
                        lightningNetwork: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="whale-sentiment">
                      Whale & Sentiment Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Whale movements, exchange reserves, and market sentiment
                    </p>
                  </div>
                  <Switch
                    id="whale-sentiment"
                    checked={visibility.whaleAndSentiment}
                    onCheckedChange={(checked) =>
                      setVisibility((prev) => ({
                        ...prev,
                        whaleAndSentiment: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="ai-news">AI & News</Label>
                    <p className="text-sm text-muted-foreground">
                      AI predictions and latest Bitcoin news
                    </p>
                  </div>
                  <Switch
                    id="ai-news"
                    checked={visibility.aiAndNews}
                    onCheckedChange={(checked) =>
                      setVisibility((prev) => ({ ...prev, aiAndNews: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="price-alerts">Price alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for price movements
                    </p>
                  </div>
                  <Switch id="price-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="whale-alerts">Whale alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for large transaction movements
                    </p>
                  </div>
                  <Switch id="whale-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="news-alerts">News and updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about important Bitcoin news
                    </p>
                  </div>
                  <Switch id="news-alerts" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            className="bg-gradient-to-r from-bitcoin to-amber-500 hover:from-bitcoin/90 hover:to-amber-500/90 text-white"
            onClick={handleSavePreferences}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Preferences;
