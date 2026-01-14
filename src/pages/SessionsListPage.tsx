import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { sessionsCollection } from '@/lib/firestore-collections';
import type { Session } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Play, BarChart2, Video } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import SessionStatusBadge from '@/components/SessionStatusBadge';
import { DuplicateSessionDialog } from '@/components/DuplicateSessionDialog';

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const q = query(sessionsCollection, orderBy('scheduledStart', 'desc'));
        const snapshot = await getDocs(q);
        const fetchedSessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSessionCreated = (newSession: Session) => {
    // Add new session to top of list as it's likely sorted by desc start time, 
    // but simplified just prepend it for immediate feedback or re-sort
    setSessions(prev => [newSession, ...prev].sort((a, b) => 
      new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
    ));
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading sessions..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">Manage and view your live sessions.</p>
        </div>
        <Button>
          <Video className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-dashed border rounded-lg bg-muted/20">
            <Video className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No sessions found</h3>
            <p className="text-muted-foreground mt-2 mb-4">Get started by creating your first session.</p>
            <Button variant="outline">Create Session</Button>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[calc(100%-80px)]">
                    <CardTitle className="line-clamp-1" title={session.title}>{session.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-3 w-3" />
                      {format(new Date(session.scheduledStart), 'MMM d, p')}
                    </div>
                  </div>
                  {/* Actions & Status */}
                  <div className="flex flex-col items-end gap-2">
                    <SessionStatusBadge 
                      status={
                        session.isLive 
                          ? 'live' 
                          : new Date(session.scheduledStart) > new Date() 
                            ? 'scheduled' 
                            : 'ended'
                      } 
                    />
                    <DuplicateSessionDialog session={session} onSessionCreated={handleSessionCreated} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="flex gap-2 mt-4">
                  {session.isLive || new Date(session.scheduledStart) > new Date() ? (
                     <Button className="w-full" asChild>
                       <Link to={`/session/${session.id}`}>
                         <Play className="mr-2 h-4 w-4" />
                         Join Session
                       </Link>
                     </Button>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/analytics/${session.id}`}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        View Analytics
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
