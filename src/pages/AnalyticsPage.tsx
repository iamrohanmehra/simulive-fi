import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { toast } from 'sonner';
import { getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Users, Clock, ArrowLeft, Calendar, TrendingUp, Timer, MessageSquare } from 'lucide-react';
import { 
  sessionDoc, 
  sessionAnalyticsDoc, 
  viewerSessionsCollection 
} from '@/lib/firestore-collections';
import computeSessionAnalytics from '@/lib/compute-analytics';
import type { Session, SessionAnalytics, ViewerSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ViewerDetailsTable from '@/components/ViewerDetailsTable';
import ChatArchive from '@/components/ChatArchive';
import LoadingSpinner from '@/components/LoadingSpinner';
import SessionStatusBadge from '@/components/SessionStatusBadge';
import { formatTimestamp, formatDuration } from '@/lib/format-time';



export default function AnalyticsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [viewerDetails, setViewerDetails] = useState<ViewerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Session
        const sessionSnap = await getDoc(sessionDoc(sessionId));
        if (!sessionSnap.exists()) {
          setError("Session not found");
          return;
        }
        setSession(sessionSnap.data());

        // 2. Fetch or Compute Analytics
        const analyticsSnap = await getDoc(sessionAnalyticsDoc(sessionId));
        if (analyticsSnap.exists()) {
          setAnalytics(analyticsSnap.data());
        } else {
          // Compute if not exists
          try {
            const computed = await computeSessionAnalytics(sessionId);
            setAnalytics(computed);
          } catch (computeErr) {
            console.error("Failed to compute analytics:", computeErr);
            toast.error("Failed to compute analytics");
          }
        }

        // 3. Fetch Viewer Sessions
        const viewersSnap = await getDocs(
          query(viewerSessionsCollection, where('sessionId', '==', sessionId), orderBy('joinedAt', 'asc'))
        );
        
        // Map docs to data
        setViewerDetails(viewersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." className="h-screen w-full" />;
  }

  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <p className="text-muted-foreground">The requested session analytics could not be found.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const sessionDuration = session.scheduledEnd && session.scheduledStart 
    ? (new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()) / 1000 
    : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Page Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
              <SessionStatusBadge 
                status={
                  session.isLive 
                    ? 'live' 
                    : new Date(session.scheduledStart) > new Date() 
                      ? 'scheduled' 
                      : 'ended'
                } 
              />
            </div>
            <div className="mt-2 flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{formatTimestamp(new Date(session.scheduledStart))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Total Viewers"
          value={analytics?.totalViewers ?? 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Peak Viewers"
          value={analytics?.peakViewers ?? 0}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Avg Watch Time"
          value={formatDuration(analytics?.avgWatchTime ?? 0)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Session Duration"
          value={formatDuration(sessionDuration)}
          icon={<Timer className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Messages"
          value={analytics?.totalMessages ?? 0}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Viewer Details Table */}
        <div className="lg:col-span-2">
          <ViewerDetailsTable viewers={viewerDetails} sessionDuration={sessionDuration} sessionId={sessionId} />
        </div>

        {/* Chat Archive */}
        <div>
          <ChatArchive sessionId={sessionId || ''} />
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
