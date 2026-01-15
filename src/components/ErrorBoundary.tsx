import { Component, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function ErrorFallback({ error }: { error: unknown }) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/sessions';
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while rendering this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="rounded-md bg-muted p-4 text-sm font-mono text-muted-foreground break-all max-h-[200px] overflow-auto">
              {errorMessage}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoHome}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Sessions
          </Button>
          <Button 
            className="w-full" 
            onClick={handleReload}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // ... existing implementation preserved for now if needed, or simplified
  render() {
      if (this.state.hasError && this.state.error) {
          return <ErrorFallback error={this.state.error} />;
      }
      return this.props.children;
  }
}
