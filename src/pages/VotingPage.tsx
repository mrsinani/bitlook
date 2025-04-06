import VotingDapp from "../components/voting/VotingDapp";

const VotingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pt-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Decentralized Voting Platform</h1>
          <p className="text-lg text-muted-foreground">
            Secure, transparent, and tamper-proof voting on the blockchain
          </p>
        </div>
        
        <VotingDapp />
        
        <div className="mt-16 mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3 text-center">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Connect Wallet</h3>
              <p className="text-muted-foreground">
                Connect your Ethereum wallet to authenticate and interact with the voting contract.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Cast Your Vote</h3>
              <p className="text-muted-foreground">
                Choose your preferred candidate and submit your vote securely to the blockchain.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">View Results</h3>
              <p className="text-muted-foreground">
                Track voting results in real-time with transparent, verifiable outcomes.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-16 mb-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Benefits of Blockchain Voting</h2>
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Tamper-proof</h3>
                <p className="text-sm text-muted-foreground">
                  Once recorded, votes cannot be altered or deleted.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Transparency</h3>
                <p className="text-sm text-muted-foreground">
                  All votes are publicly verifiable while maintaining voter privacy.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                  Cryptographically secure voting ensures data integrity.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Decentralization</h3>
                <p className="text-sm text-muted-foreground">
                  No central authority controls the voting process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPage; 