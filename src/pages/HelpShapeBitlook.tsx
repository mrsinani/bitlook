import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for feature proposals
const mockProposals = [
  {
    id: 1,
    title: "Advanced Portfolio Tracking",
    description:
      "Track your Bitcoin holdings across multiple wallets and exchanges with detailed performance metrics.",
    votes: 132,
  },
  {
    id: 2,
    title: "On-Chain Analytics Dashboard",
    description:
      "Detailed on-chain metrics and visualizations to help you understand network activity.",
    votes: 89,
  },
  {
    id: 3,
    title: "Price Alert Notifications",
    description:
      "Set custom price alerts and receive notifications when thresholds are reached.",
    votes: 76,
  },
  {
    id: 4,
    title: "Technical Analysis Tools",
    description:
      "Advanced charting and technical analysis tools to identify trading opportunities.",
    votes: 54,
  },
  {
    id: 5,
    title: "Social Sentiment Tracker",
    description:
      "Monitor Bitcoin sentiment across social media platforms and news sources.",
    votes: 43,
  },
];

const HelpShapeBitlook = () => {
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();
  const [proposals, setProposals] = useState(mockProposals);
  const [votedProposals, setVotedProposals] = useState<number[]>([]);

  // This would be replaced with a real API call to fetch user's voted proposals
  useEffect(() => {
    // Simulating loading from localStorage or a database
    if (user?.id) {
      const savedVotes = localStorage.getItem(`bitlook-votes-${user.id}`);
      if (savedVotes) {
        setVotedProposals(JSON.parse(savedVotes));
      }
    }
  }, [user?.id]);

  const handleVote = (proposalId: number) => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on feature proposals.",
        variant: "destructive",
      });
      return;
    }

    // Check if user already voted for this proposal
    if (votedProposals.includes(proposalId)) {
      toast({
        title: "Already voted",
        description: "You have already voted for this proposal.",
      });
      return;
    }

    // Update proposals with new vote count
    setProposals(
      proposals.map((proposal) =>
        proposal.id === proposalId
          ? { ...proposal, votes: proposal.votes + 1 }
          : proposal
      )
    );

    // Add to voted proposals
    const newVotedProposals = [...votedProposals, proposalId];
    setVotedProposals(newVotedProposals);

    // Save to localStorage (would be a database in production)
    if (user?.id) {
      localStorage.setItem(
        `bitlook-votes-${user.id}`,
        JSON.stringify(newVotedProposals)
      );
    }

    toast({
      title: "Vote recorded",
      description: "Thank you for helping shape the future of Bitlook!",
    });
  };

  const handleUnvote = (proposalId: number) => {
    if (!isSignedIn) {
      return;
    }

    // Check if user has voted for this proposal
    if (!votedProposals.includes(proposalId)) {
      return;
    }

    // Update proposals with decreased vote count
    setProposals(
      proposals.map((proposal) =>
        proposal.id === proposalId
          ? { ...proposal, votes: Math.max(0, proposal.votes - 1) }
          : proposal
      )
    );

    // Remove from voted proposals
    const newVotedProposals = votedProposals.filter((id) => id !== proposalId);
    setVotedProposals(newVotedProposals);

    // Save to localStorage (would be a database in production)
    if (user?.id) {
      localStorage.setItem(
        `bitlook-votes-${user.id}`,
        JSON.stringify(newVotedProposals)
      );
    }

    toast({
      title: "Vote removed",
      description: "Your vote has been removed.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Help Shape Bitlook
          </h1>
          <p className="text-muted-foreground">
            Vote on upcoming features to help us prioritize development
          </p>
        </div>

        {/* Wallet status banner */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isSignedIn
                    ? "Your wallet is connected"
                    : "Connect your wallet to vote"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSignedIn
                    ? `Connected as ${
                        user?.primaryEmailAddress?.emailAddress || user?.id
                      }`
                    : "Sign in to participate in community voting"}
                </p>
              </div>
              {!isSignedIn && <Button variant="outline">Connect Wallet</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Feature proposals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="transition-all hover:bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{proposal.title}</CardTitle>
                <CardDescription>{proposal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-5 w-5" />
                    <span className="font-medium">{proposal.votes} votes</span>
                  </div>
                  {votedProposals.includes(proposal.id) ? (
                    <Button
                      variant="outline"
                      className="border-red-500 hover:bg-red-500/10"
                      onClick={() => handleUnvote(proposal.id)}
                    >
                      Unvote
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleVote(proposal.id)}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feedback section */}
        <Card>
          <CardHeader>
            <CardTitle>Have a feature idea?</CardTitle>
            <CardDescription>
              We're always looking for new ideas to improve Bitlook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                toast({
                  title: "Coming soon",
                  description:
                    "Feature suggestion form will be available soon.",
                });
              }}
            >
              Suggest a Feature
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HelpShapeBitlook;
