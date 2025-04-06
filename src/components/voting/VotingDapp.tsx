import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/use-toast";
import CandidateList from "./CandidateList";
import VotingStatus from "./VotingStatus";
import AdminPanel from "./AdminPanel";
import votingAbi from "../../lib/contracts/VotingAbi";

// Contract addresses for different environments
const CONTRACT_ADDRESSES = {
  // Hardhat local network
  development: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  // Add production/testnet addresses when deployed
  production: import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || "",
  testnet: import.meta.env.VITE_TESTNET_VOTING_CONTRACT_ADDRESS || "",
};

// Select the appropriate contract address based on environment
const CONTRACT_ADDRESS =
  process.env.NODE_ENV === "production"
    ? CONTRACT_ADDRESSES.production
    : import.meta.env.VITE_NETWORK === "testnet"
    ? CONTRACT_ADDRESSES.testnet
    : CONTRACT_ADDRESSES.development;

export interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

const VotingDapp = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votingStatus, setVotingStatus] = useState({
    isOpen: false,
    endTime: 0,
    timeRemaining: 0,
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const { toast } = useToast();

  // Connect to Ethereum and set up contract
  const connectWallet = async () => {
    try {
      setNetworkError(null);
      if (!CONTRACT_ADDRESS) {
        setNetworkError("Contract address not configured for this environment");
        setIsLoading(false);
        return;
      }

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        // Get the network to make sure we're on the right chain
        const network = await provider.getNetwork();

        // Check if we have a deployed contract on this network
        try {
          const votingContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            votingAbi,
            signer
          );

          setContract(votingContract);
          setAccount(accounts[0]);

          // Check if current user is the contract owner
          const owner = await votingContract.owner();
          setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

          // Load initial data
          await loadContractData(votingContract, accounts[0]);

          // Listen for account changes
          window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
            setAccount(newAccounts[0]);
            checkOwner(votingContract, newAccounts[0]);
            checkVotingStatus(votingContract);
            checkHasVoted(votingContract, newAccounts[0]);
          });
        } catch (error) {
          console.error("Contract error:", error);
          setNetworkError(
            "Could not connect to the voting contract. Make sure you're on the correct network."
          );
        }

        setIsLoading(false);
      } else {
        toast({
          variant: "destructive",
          title: "Ethereum provider not found",
          description:
            "Please install MetaMask or another Ethereum wallet to use this dApp.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to your wallet.",
      });
      setIsLoading(false);
    }
  };

  const loadContractData = async (
    contract: ethers.Contract,
    userAddress: string
  ) => {
    await Promise.all([
      loadCandidates(contract),
      checkVotingStatus(contract),
      checkHasVoted(contract, userAddress),
    ]);
  };

  const loadCandidates = async (contract: ethers.Contract) => {
    try {
      const allCandidates = await contract.getAllCandidates();
      const formattedCandidates = allCandidates.map((candidate: any) => ({
        id: Number(candidate.id),
        name: candidate.name,
        voteCount: Number(candidate.voteCount),
      }));
      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };

  const checkOwner = async (contract: ethers.Contract, userAddress: string) => {
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking owner:", error);
    }
  };

  const checkVotingStatus = async (contract: ethers.Contract) => {
    try {
      const status = await contract.getVotingStatus();
      setVotingStatus({
        isOpen: status.isOpen,
        endTime: Number(status.endTime),
        timeRemaining: Number(status.timeRemaining),
      });
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };

  const checkHasVoted = async (
    contract: ethers.Contract,
    userAddress: string
  ) => {
    try {
      const voted = await contract.hasVoted(userAddress);
      setHasVoted(voted);
    } catch (error) {
      console.error("Error checking if user has voted:", error);
    }
  };

  const vote = async (candidateId: number) => {
    if (!contract || !votingStatus.isOpen || hasVoted) return;

    try {
      setIsLoading(true);
      const tx = await contract.vote(candidateId);
      await tx.wait();

      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded on the blockchain.",
      });

      // Refresh data
      await loadCandidates(contract);
      await checkHasVoted(contract, account);
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        variant: "destructive",
        title: "Voting Error",
        description: error.message || "Failed to cast your vote.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet on component mount
  useEffect(() => {
    connectWallet();
  }, []);

  // Update contract data periodically
  useEffect(() => {
    if (!contract) return;

    const interval = setInterval(() => {
      checkVotingStatus(contract);
      loadCandidates(contract);
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [contract]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>Loading voting application...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (networkError) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Network Error</CardTitle>
          <CardDescription>
            There was a problem connecting to the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{networkError}</AlertDescription>
          </Alert>
          <Button onClick={connectWallet} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Decentralized Voting Application</CardTitle>
          <CardDescription>
            Connect your wallet to participate in the voting process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Decentralized Voting Application</CardTitle>
          <CardDescription>
            Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <VotingStatus status={votingStatus} />

          {isOwner && (
            <AdminPanel
              contract={contract}
              votingStatus={votingStatus}
              onUpdate={() => loadContractData(contract!, account)}
            />
          )}

          <CandidateList
            candidates={candidates}
            canVote={votingStatus.isOpen && !hasVoted}
            onVote={vote}
          />

          {hasVoted && (
            <Alert>
              <AlertTitle>You have already voted</AlertTitle>
              <AlertDescription>
                Your vote has been recorded. You can't change your vote.
              </AlertDescription>
            </Alert>
          )}

          {!votingStatus.isOpen && (
            <Alert>
              <AlertTitle>Voting is not currently active</AlertTitle>
              <AlertDescription>
                {candidates.length > 0
                  ? "The voting period is closed or has not started yet."
                  : "No voting campaign has been set up yet."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Contract: {CONTRACT_ADDRESS.slice(0, 6)}...
            {CONTRACT_ADDRESS.slice(-4)}
          </p>
          <Button variant="outline" size="sm" onClick={connectWallet}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VotingDapp;
