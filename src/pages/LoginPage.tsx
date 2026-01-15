
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/sessions" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Session Access</CardTitle>
          <CardDescription>Enter a Session ID to join directly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
             <p className="text-sm text-muted-foreground">
                Please navigate directly to a session URL (e.g., /session/your-id).
             </p>
             <Button asChild>
                <a href="/session/session-live">Go to Demo Session</a>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
