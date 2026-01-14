import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionAnalytics } from '@/lib/types';

interface SessionEndedScreenProps {
  sessionTitle: string;
  sessionAnalytics?: SessionAnalytics;
}

const SessionEndedScreen = ({ sessionTitle, sessionAnalytics }: SessionEndedScreenProps) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center border-border/50 shadow-lg">
        <CardHeader className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Session has ended</h1>
          <CardTitle className="text-xl font-medium text-muted-foreground">
            {sessionTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {sessionAnalytics && (
            <div className="grid grid-cols-3 gap-4 py-4 rounded-lg bg-muted/50">
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl font-bold">{sessionAnalytics.totalViewers}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Viewers</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1 border-x border-border/50">
                <span className="text-2xl font-bold">{sessionAnalytics.peakViewers}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Peak</span>
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl font-bold">{sessionAnalytics.totalMessages}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Messages</span>
              </div>
            </div>
          )}

          <div className="text-muted-foreground">
            <p>Thank you for attending!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionEndedScreen;
