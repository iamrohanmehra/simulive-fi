import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, PieChart, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// FIXED: Define local interface with proper types instead of any
interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface AdminPoll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Timestamp | string;
  durationMinutes: number;
  isActive: boolean;
  totalVotes: number;
}

interface ActivePollsPanelProps {
  sessionId: string;
}

const ActivePollsPanel = ({ sessionId }: ActivePollsPanelProps) => {
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'polls'),
      where('sessionId', '==', sessionId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activePolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminPoll[];
      
      setPolls(activePolls);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching polls:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleClosePoll = async (pollId: string) => {
    setClosingId(pollId);
    try {
      await updateDoc(doc(db, 'polls', pollId), {
        isActive: false
      });
      toast.success('Poll closed');
    } catch (error) {
      console.error('Failed to close poll:', error);
      toast.error('Failed to close poll');
    } finally {
      setClosingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-purple-500 shadow-sm mb-6 animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (polls.length === 0) {
    return null; // Don't show anything if no active polls
  }

  return (
    <div className="space-y-4 mb-6">
      {polls.map((poll) => (
        <Card key={poll.id} className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-purple-700 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Active Poll
              </CardTitle>
              <Badge variant="secondary" className="animate-pulse">
                Live
              </Badge>
            </div>
            <p className="font-semibold text-lg mt-2">{poll.question}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 
                  ? Math.round((option.votes / poll.totalVotes) * 100) 
                  : 0;
                
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option.text}</span>
                      <span className="font-medium">{percentage}% ({option.votes})</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Total votes: {poll.totalVotes}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              onClick={() => handleClosePoll(poll.id)}
              disabled={closingId === poll.id}
            >
              {closingId === poll.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Close Poll
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ActivePollsPanel;
