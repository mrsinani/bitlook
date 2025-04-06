import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/use-toast";
import CandidateList from './CandidateList';
import VotingStatus from './VotingStatus';
import AdminPanel from './AdminPanel';
import votingAbi from '../../lib/contracts/VotingAbi';

// The address will need to be updated after deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

const VotingDapp = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votingStatus, setVotingStatus] = useState({
    isOpen: false,
    endTime: 0,
    timeRemaining: 0
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Connect to Ethereum and set up contract
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        
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
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          setAccount(newAccounts[0]);
          checkOwner(votingContract, newAccounts[0]);
          checkVotingStatus(votingContract);
          checkHasVoted(votingContract, newAccounts[0]);
        });
        
        setIsLoading(false);
      } else {
        toast({
          variant: "destructive",
          title: "Ethereum provider not found",
          description: "Please install MetaMask or another Ethereum wallet to use this dApp.",
        });
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to your wallet.",
      });
    }
  };

  const loadContractData = async (contract: ethers.Contract, userAddress: string) => {
    await Promise.all([
      loadCandidates(contract),
      checkVotingStatus(contract),
      checkHasVoted(contract, userAddress)
    ]);
  };

  const loadCandidates = async (contract: ethers.Contract) => {
    try {
      const allCandidates = await contract.getAllCandidates();
      const formattedCandidates = allCandidates.map((candidate: any) => ({
        id: Number(candidate.id),
        name: candidate.name,
        voteCount: Number(candidate.voteCount)
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
        timeRemaining: Number(status.timeRemaining)
      });
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };

  const checkHasVoted = async (contract: ethers.Contract, userAddress: string) => {
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

  if (!account) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Decentralized Voting Application</CardTitle>
          <CardDescription>Connect your wallet to participate in the voting process</CardDescription>
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
              <AlertTitle>
                {candidates.length > 0 ? "Voting is currently closed" : "No active voting"}
              </AlertTitle>
              <AlertDescription>
                {candidates.length > 0 
                  ? "Please wait for the admin to start the voting process."
                  : "No candidates have been added yet."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Using Ethereum blockchain for secure and transparent voting
          </p>
          <Button variant="outline" onClick={connectWallet}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VotingDapp; 