import { useState } from 'react';
import { Plus, Trash2, Loader2, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useChat from '@/hooks/useChat';

interface PollCreatorProps {
  sessionId: string;
  onPollCreated?: () => void;
}

const PollCreator = ({ sessionId, onPollCreated }: PollCreatorProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState<number>(5);
  const [creating, setCreating] = useState(false);
  const { sendMessage } = useChat(sessionId);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = async () => {
    // Validation
    if (!question.trim()) {
      toast.error('Please enter a poll question');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 valid options');
      return;
    }

    if (duration < 1) {
      toast.error('Duration must be at least 1 minute');
      return;
    }

    setCreating(true);
    try {
      // Create poll in Firestore
      await addDoc(collection(db, 'polls'), {
        sessionId,
        question: question.trim(),
        options: validOptions.map((text, index) => ({ id: index, text, votes: 0 })),
        createdAt: serverTimestamp(),
        durationMinutes: duration,
        isActive: true,
        totalVotes: 0
      });

      // Broadcast system message
      await sendMessage(`New poll: ${question.trim()}`, 'system');

      toast.success('Poll created successfully');
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setDuration(5);
      
      if (onPollCreated) {
        onPollCreated();
      }
    } catch (_error) {
      toast.error('Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <BarChart2 className="h-5 w-5" />
          Create Poll
        </CardTitle>
        <CardDescription>
          Ask a question to the audience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-3">
        <div className="space-y-2">
          <Label>Question</Label>
          <Input
            placeholder="Ask something..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={creating}
          />
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                disabled={creating}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                  disabled={creating}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          {options.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={creating}
              className="w-full mt-1 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            disabled={creating}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
          onClick={handleCreatePoll}
          disabled={creating}
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Poll'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PollCreator;
