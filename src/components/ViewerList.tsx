import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Users, User as UserIcon } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Viewer {
  id: string;
  userId: string | null;
  name?: string; // Optional if we store it, otherwise fallback
  email?: string;
  joinedAt: Timestamp;
}

interface ViewerListProps {
  sessionId: string;
}

const ViewerList = ({ sessionId }: ViewerListProps) => {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Create query for active viewers (leftAt is null)
    const viewersQuery = query(
      collection(db, 'viewer_sessions'),
      where('sessionId', '==', sessionId),
      where('leftAt', '==', null),
      orderBy('joinedAt', 'desc') // Newest first
    );

    const unsubscribe = onSnapshot(viewersQuery, (snapshot) => {
      const activeViewers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Viewer[];
      
      setViewers(activeViewers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching viewers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'G'; // Guest
  };

  const getName = (viewer: Viewer) => {
    // In a real app we might join with users collection, but assuming viewer_session might have some info or we just show "Guest" / "User <ID>"
    // The requirement says "Name or email". 
    // If our viewer_session doesn't store name/email, we might need to rely on what's there.
    // Let's assume for now viewer_sessions has 'email' or we show "Guest" if standard guest.
    // If the data structure doesn't have it, we'll fallbacks.
    if (viewer.name) return viewer.name;
    if (viewer.email) return viewer.email;
    return viewer.userId ? 'Registered User' : 'Guest Viewer';
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Users className="h-4 w-4" />
            Live Viewers
          </CardTitle>
          <Badge variant="secondary" className="rounded-full px-3">
            {viewers.length} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center p-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <UserIcon className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No viewers yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getName(viewer)}`} />
                      <AvatarFallback>{getInitials(viewer.name, viewer.email)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <p className="text-sm font-medium leading-none">{getName(viewer)}</p>
                      <p className="text-xs text-muted-foreground">
                         {viewer.userId ? 'Member' : 'Guest'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {viewer.joinedAt?.toDate ? (
                      formatDistanceToNow(viewer.joinedAt.toDate(), { addSuffix: true })
                    ) : (
                      'Just now'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ViewerList;
