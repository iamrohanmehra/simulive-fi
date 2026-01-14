
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold tracking-tight sm:text-6xl">404</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-lg text-muted-foreground">Page not found</p>
          <Button onClick={() => navigate('/sessions')}>
            Go to Sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
