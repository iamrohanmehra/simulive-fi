import { useState } from 'react';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { sessionsCollection } from '@/lib/firestore-collections';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DuplicateSessionDialogProps {
  session: Session;
  onSessionCreated?: (newSession: Session) => void;
}

export function DuplicateSessionDialog({ session, onSessionCreated }: DuplicateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Default new date: +1 week from original, or tomorrow if original is past
  const getInitialDate = () => {
    const originalDate = new Date(session.scheduledStart);
    const now = new Date();
    
    let baseDate = originalDate;
    if (originalDate < now) {
      baseDate = now;
      baseDate.setDate(baseDate.getDate() + 1); // Tomorrow
    } else {
      baseDate.setDate(baseDate.getDate() + 7); // +1 Week
    }
    
    // Format to datetime-local string: YYYY-MM-DDTHH:mm
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    const hours = String(baseDate.getHours()).padStart(2, '0');
    const minutes = String(baseDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [newStartDate, setNewStartDate] = useState(getInitialDate());

  const handleDuplicate = async () => {
    if (!newStartDate) return;

    try {
      setLoading(true);

      // 1. Calculate Duration
      const oldStart = new Date(session.scheduledStart).getTime();
      const oldEnd = new Date(session.scheduledEnd).getTime();
      const durationMs = oldEnd - oldStart;

      // 2. Calculate New End
      const newStartObj = new Date(newStartDate);
      const newEndObj = new Date(newStartObj.getTime() + durationMs);

      // 3. Create New Session Object
      // Omit id, we let firestore generate it
      // Omit analytics/viewer data
      const newSessionData = {
        title: `${session.title} (Copy)`,
        screenUrl: session.screenUrl,
        faceUrl: session.faceUrl || null,
        scheduledStart: newStartObj.toISOString(),
        scheduledEnd: newEndObj.toISOString(),
        isLive: false,
        chatEnabled: session.chatEnabled,
        createdAt: serverTimestamp(), // Use server timestamp for creation
      };

      // 4. Add to Firestore
      const docRef = await addDoc(sessionsCollection, newSessionData as any); // Type assertion for serverTimestamp
      
      const newSessionWithId = {
        ...newSessionData,
        id: docRef.id,
        createdAt: new Date().toISOString() // Optimistic
      } as Session;

      toast.success("Session duplicated successfully", {
        action: {
          label: "Edit Session",
          onClick: () => navigate(`/session/${docRef.id}/edit`)
        }
      });

      if (onSessionCreated) {
        onSessionCreated(newSessionWithId);
      }
      
      setOpen(false);
    } catch (error) {
      console.error("Failed to duplicate session:", error);
      toast.error("Failed to duplicate session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Duplicate Session">
           <Copy className="h-4 w-4" />
           <span className="sr-only">Duplicate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Session</DialogTitle>
          <DialogDescription>
            Create a copy of "{session.title}". Viewers and messages will NOT be copied.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              Start Time
            </Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <p className="text-xs text-muted-foreground ml-[25%] px-1">
            Duration: {Math.round((new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()) / 60000)} mins
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleDuplicate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
