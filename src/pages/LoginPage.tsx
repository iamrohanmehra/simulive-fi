
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
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for actual login form */}
          <div className="flex flex-col gap-4">
             <p className="text-sm text-muted-foreground">Login form implementation pending...</p>
             <Button>Sign In</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
