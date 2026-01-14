import { Component, type ErrorInfo, type ReactNode } from 'react';
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

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/sessions';
  };

  render() {
    if (this.state.hasError) {
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
              {this.state.error && (
                <div className="rounded-md bg-muted p-4 text-sm font-mono text-muted-foreground break-all max-h-[200px] overflow-auto">
                  {this.state.error.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={this.handleGoHome}
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Sessions
              </Button>
              <Button 
                className="w-full" 
                onClick={this.handleReload}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
