import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface AdminPanelProps {
  contract: ethers.Contract | null;
  votingStatus: {
    isOpen: boolean;
    endTime: number;
    timeRemaining: number;
  };
  onUpdate: () => void;
}

const AdminPanel = ({ contract, votingStatus, onUpdate }: AdminPanelProps) => {
  const [candidateName, setCandidateName] = useState('');
  const [votingDuration, setVotingDuration] = useState('60');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addCandidate = async () => {
    if (!contract || !candidateName.trim()) return;

    try {
      setIsLoading(true);
      const tx = await contract.addCandidate(candidateName);
      await tx.wait();
      
      toast({
        title: "Candidate Added",
        description: `${candidateName} has been added as a candidate.`,
      });
      
      setCandidateName('');
      onUpdate();
    } catch (error: any) {
      console.error("Error adding candidate:", error);
      toast({
        variant: "destructive",
        title: "Failed to Add Candidate",
        description: error.message || "An error occurred while adding the candidate.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoting = async () => {
    if (!contract) return;
    
    const duration = parseInt(votingDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Duration",
        description: "Please enter a valid voting duration in minutes.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const tx = await contract.startVoting(duration);
      await tx.wait();
      
      toast({
        title: "Voting Started",
        description: `Voting has started and will be open for ${duration} minutes.`,
      });
      
      onUpdate();
    } catch (error: any) {
      console.error("Error starting voting:", error);
      toast({
        variant: "destructive",
        title: "Failed to Start Voting",
        description: error.message || "An error occurred while starting the voting.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endVoting = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      const tx = await contract.endVoting();
      await tx.wait();
      
      toast({
        title: "Voting Ended",
        description: "Voting has been closed.",
      });
      
      onUpdate();
    } catch (error: any) {
      console.error("Error ending voting:", error);
      toast({
        variant: "destructive",
        title: "Failed to End Voting",
        description: error.message || "An error occurred while ending the voting.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Manage the voting process</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="candidates">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="voting">Voting Control</TabsTrigger>
          </TabsList>
          <TabsContent value="candidates" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="candidateName">Add New Candidate</Label>
              <div className="flex gap-2">
                <Input
                  id="candidateName"
                  placeholder="Enter candidate name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  disabled={votingStatus.isOpen || isLoading}
                />
                <Button 
                  onClick={addCandidate} 
                  disabled={votingStatus.isOpen || !candidateName.trim() || isLoading}
                >
                  Add
                </Button>
              </div>
              {votingStatus.isOpen && (
                <p className="text-sm text-gray-500">
                  Cannot add candidates while voting is open.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="voting" className="space-y-4 mt-4">
            {!votingStatus.isOpen ? (
              <div className="grid gap-2">
                <Label htmlFor="votingDuration">Voting Duration (minutes)</Label>
                <div className="flex gap-2">
                  <Input
                    id="votingDuration"
                    type="number"
                    min="1"
                    value={votingDuration}
                    onChange={(e) => setVotingDuration(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={startVoting} 
                    disabled={isLoading}
                  >
                    Start Voting
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <p className="text-sm">
                  Voting is currently open. You can end the voting early if needed.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={endVoting} 
                  disabled={isLoading}
                >
                  End Voting
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPanel; 