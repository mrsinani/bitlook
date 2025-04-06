import { Candidate } from './VotingDapp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BarChart } from "../ui/bar-chart";

interface CandidateListProps {
  candidates: Candidate[];
  canVote: boolean;
  onVote: (candidateId: number) => void;
}

const CandidateList = ({ candidates, canVote, onVote }: CandidateListProps) => {
  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No candidates available.</p>
        </CardContent>
      </Card>
    );
  }

  // Get the total number of votes
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  // Generate chart data
  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => c.voteCount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            {totalVotes} total votes cast
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalVotes > 0 && (
            <div className="h-64 mb-6">
              <BarChart data={chartData} options={chartOptions} />
            </div>
          )}
          
          <div className="grid gap-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="bg-muted">
                <CardContent className="pt-6 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{candidate.name}</h3>
                    <p className="text-sm text-gray-500">
                      {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'} 
                      {totalVotes > 0 && ` (${Math.round((candidate.voteCount / totalVotes) * 100)}%)`}
                    </p>
                  </div>
                  {canVote && (
                    <Button onClick={() => onVote(candidate.id)}>
                      Vote
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateList; 