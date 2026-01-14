import { useState, useEffect } from 'react';
import type { Poll } from '@/lib/types';
import { pollVotesCollection } from '@/lib/firestore-collections';
import { query, where, onSnapshot, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PollVoteCardProps {
  poll: Poll;
  userId: string;
}

export default function PollVoteCard({ poll, userId }: PollVoteCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVoteOptionId, setUserVoteOptionId] = useState<string | null>(null);

  // Check if user has already voted
  useEffect(() => {
    if (!userId || !poll.id) return;

    const q = query(
      pollVotesCollection,
      where('pollId', '==', poll.id),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setHasVoted(true);
        setUserVoteOptionId(snapshot.docs[0].data().selectedOptionId);
      } else {
        setHasVoted(false);
        setUserVoteOptionId(null);
      }
    });

    return () => unsubscribe();
  }, [poll.id, userId]);

  const handleVote = async () => {
    if (!selectedOptionId) {
      toast.error("Please select an option");
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create vote document
        const voteRef = doc(pollVotesCollection);
        transaction.set(voteRef, {
          pollId: poll.id,
          userId: userId,
          selectedOptionId: selectedOptionId,
          votedAt: serverTimestamp(),
        } as any);

        // 2. Update poll document vote counts
        // We assume the poll document ref is known. We query it by ID.
        // Actually we need the poll doc ref.
        // Since we don't have the poll Ref passed comfortably, we construct it.
        // Assuming polls are in 'polls' collection root as defined in firestore-collections
        const pollRef = doc(db, 'polls', poll.id);
        
        const pollDoc = await transaction.get(pollRef);
        if (!pollDoc.exists()) {
          throw new Error("Poll does not exist!");
        }

        const pollData = pollDoc.data() as Poll;
        const newOptions = pollData.options.map(opt => {
          if (opt.id === selectedOptionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        transaction.update(pollRef, { options: newOptions });
      });

      toast.success("Vote submitted!");
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

  return (
    <Card className="mb-4 border-indigo-500/20 bg-indigo-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-400">
          Live Poll
        </CardTitle>
        <h3 className="text-lg font-semibold">{poll.question}</h3>
      </CardHeader>
      <CardContent>
        {hasVoted ? (
          <div className="space-y-3">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isSelected = option.id === userVoteOptionId;
              
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${isSelected ? 'text-indigo-400' : ''}`}>
                      {option.label}
                      {isSelected && " (You)"}
                    </span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {option.votes} votes
                  </div>
                </div>
              );
            })}
            <div className="pt-2 text-xs text-center text-muted-foreground">
              Total votes: {totalVotes}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={selectedOptionId || ""} onValueChange={setSelectedOptionId}>
              {poll.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="grow cursor-pointer py-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button 
              onClick={handleVote} 
              disabled={!selectedOptionId || isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Vote"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
