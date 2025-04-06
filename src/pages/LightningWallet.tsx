import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  CopyIcon,
  QrCodeIcon,
  RefreshCw,
  Send,
  Wallet,
  Download,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import QRCode from "qrcode.react";
import {
  lightningService,
  mempoolService,
  LightningTransaction,
  NodeInfo,
  formatSats,
  satsToUSD,
  NetworkStats,
} from "@/services/lightning";

const LightningWallet = () => {
  const { user } = useUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<LightningTransaction[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [sendInvoice, setSendInvoice] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveDescription, setReceiveDescription] = useState("");
  const [invoice, setInvoice] = useState("");
  const [activeTab, setActiveTab] = useState("send");

  // Load wallet data on mount
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setIsLoading(true);

        // Fetch wallet data, network stats, and node info in parallel
        const [walletData, stats, info] = await Promise.all([
          lightningService.getWalletData(),
          mempoolService.getLightningNetworkStats(),
          lightningService.getNodeInfo(),
        ]);

        setBalance(walletData.balance);
        setTransactions(walletData.transactions);
        setNetworkStats(stats);
        setNodeInfo(info);
      } catch (error) {
        console.error("Failed to load wallet data:", error);
        toast({
          title: "Error loading wallet data",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Fetch updated data
      const walletData = await lightningService.getWalletData();
      setBalance(walletData.balance);
      setTransactions(walletData.transactions);

      toast({
        title: "Wallet refreshed",
        description: "Latest balance and transactions loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update wallet data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPayment = async () => {
    if (!sendInvoice) {
      toast({
        title: "Invalid invoice",
        description: "Please enter a Lightning invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Process payment using lightningService
      const result = await lightningService.payInvoice(sendInvoice);

      if (result.success) {
        // Update balance and add transaction
        setBalance((prevBalance) => prevBalance - result.amount);

        const newTransaction: LightningTransaction = {
          id: `tx${Date.now()}`,
          amount: result.amount,
          date: new Date(),
          description: "Lightning payment",
          status: "complete",
          type: "outgoing",
          paymentRequest: sendInvoice,
        };

        setTransactions((prev) => [newTransaction, ...prev]);

        toast({
          title: "Payment sent!",
          description: `${formatSats(
            result.amount
          )} sats payment completed successfully.`,
        });

        // Reset form
        setSendInvoice("");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment failed",
        description: "Could not complete the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!receiveAmount || parseInt(receiveAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount in sats.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Generate invoice using lightningService
      const newInvoice = await lightningService.createInvoice({
        amount: parseInt(receiveAmount),
        description: receiveDescription || "Lightning Invoice",
      });

      setInvoice(newInvoice);

      // Create pending transaction
      const newTransaction: LightningTransaction = {
        id: `invoice-${Date.now()}`,
        amount: parseInt(receiveAmount),
        date: new Date(),
        description: receiveDescription || "Lightning invoice",
        status: "pending",
        type: "incoming",
        paymentRequest: newInvoice,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      toast({
        title: "Invoice generated",
        description: `Invoice for ${receiveAmount} sats created successfully.`,
      });
    } catch (error) {
      console.error("Invoice generation failed:", error);
      toast({
        title: "Invoice generation failed",
        description: "Could not create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The invoice has been copied to your clipboard.",
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lightning Wallet</h1>
        <p className="text-muted-foreground">
          Send and receive bitcoin instantly with the Lightning Network
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Wallet Balance Card - Always visible */}
        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Wallet Balance
            </CardTitle>
            <CardDescription>
              Your current Lightning Network balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              {isLoading || balance === null ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <>
                  <span className="text-4xl font-bold">
                    {formatSats(balance)}
                  </span>
                  <span className="ml-2 text-lg text-muted-foreground">
                    sats
                  </span>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              ≈ ${isLoading || balance === null ? "..." : satsToUSD(balance)}{" "}
              USD
            </div>
          </CardContent>
        </Card>

        {/* Main Wallet Features */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="receive">Receive</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Send Tab */}
            <TabsContent value="send" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Payment</CardTitle>
                  <CardDescription>
                    Paste a Lightning invoice to send a payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lightning-invoice">
                      Lightning Invoice (BOLT11)
                    </Label>
                    <Input
                      id="lightning-invoice"
                      placeholder="lnbc..."
                      value={sendInvoice}
                      onChange={(e) => setSendInvoice(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleSendPayment}
                    disabled={!sendInvoice || isLoading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Payment
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Receive Tab */}
            <TabsContent value="receive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Receive Payment</CardTitle>
                  <CardDescription>
                    Generate a Lightning invoice to receive funds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!invoice ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (sats)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="1000"
                          value={receiveAmount}
                          onChange={(e) => setReceiveAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Description (optional)
                        </Label>
                        <Input
                          id="description"
                          placeholder="Coffee money"
                          value={receiveDescription}
                          onChange={(e) =>
                            setReceiveDescription(e.target.value)
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleGenerateInvoice}
                        disabled={!receiveAmount || isLoading}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Generate Invoice
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="mx-auto bg-white p-2 rounded-lg inline-block">
                        <QRCode value={invoice} size={200} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Lightning Invoice:
                        </p>
                        <div className="relative">
                          <div className="max-w-full overflow-x-auto p-2 bg-muted rounded-md">
                            <code className="text-xs break-all">{invoice}</code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-2"
                            onClick={() => copyToClipboard(invoice)}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Invoice expires in 24 hours</AlertTitle>
                        <AlertDescription>
                          This invoice will expire if not paid within 24 hours.
                        </AlertDescription>
                      </Alert>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInvoice("");
                          setReceiveAmount("");
                          setReceiveDescription("");
                        }}
                      >
                        Create New Invoice
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Recent Lightning Network payments and receipts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        No transactions yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {tx.description}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {tx.date.toLocaleString()}
                              </div>
                            </div>
                            <div
                              className={`text-right ${
                                tx.type === "incoming"
                                  ? "text-positive"
                                  : "text-negative"
                              }`}
                            >
                              <div className="font-semibold">
                                {tx.type === "incoming" ? "+" : "-"}
                                {formatSats(tx.amount)} sats
                              </div>
                              <div className="text-xs uppercase">
                                {tx.status}
                              </div>
                            </div>
                          </div>
                          <Separator className="mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Node Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Node Connection</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !nodeInfo ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span className="text-sm font-medium flex items-center">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            nodeInfo.isConnected ? "bg-green-500" : "bg-red-500"
                          } mr-2`}
                        ></span>
                        {nodeInfo.isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Alias
                      </span>
                      <span className="text-sm font-medium">
                        {nodeInfo.alias}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Channels
                      </span>
                      <span className="text-sm font-medium">
                        {nodeInfo.numChannels}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Peers
                      </span>
                      <span className="text-sm font-medium">
                        {nodeInfo.numPeers}
                      </span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-sm">
                    <div className="max-w-full overflow-hidden text-ellipsis text-xs text-muted-foreground mb-2">
                      {nodeInfo.pubkey}
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      asChild
                    >
                      <a
                        href="http://bitlook.u.voltageapp.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        Node dashboard <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lightning Network Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Network Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !networkStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Network Capacity
                      </span>
                      <span className="text-sm font-medium">
                        {networkStats.networkCapacity
                          ? networkStats.networkCapacity.toLocaleString()
                          : "0"}{" "}
                        BTC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Channels
                      </span>
                      <span className="text-sm font-medium">
                        {networkStats.totalChannels
                          ? networkStats.totalChannels.toLocaleString()
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avg. Fee Rate
                      </span>
                      <span className="text-sm font-medium">
                        {networkStats.avgFeeRate || "0"} ppm
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Data provided by Mempool.space
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a
                  href="https://mempool.space"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Mempool
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab("receive")}
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Plus className="h-4 w-4 mr-2" />
                Open Channel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LightningWallet;
