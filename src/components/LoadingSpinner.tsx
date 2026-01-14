import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 48,
};

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  className 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 
        className="animate-spin text-primary" 
        size={sizeMap[size]} 
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
