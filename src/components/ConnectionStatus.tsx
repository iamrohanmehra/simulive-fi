import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

const ConnectionStatus = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-sm text-xs font-medium">
      <div className="relative flex h-2.5 w-2.5">
        {isOnline ? (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </>
        )}
      </div>
      <span className={cn(
        "hidden sm:inline-block", 
        isOnline ? "text-muted-foreground" : "text-red-500"
      )}>
        {isOnline ? 'Connected' : 'Offline Mode (Cached)'}
      </span>
    </div>
  );
};

export default ConnectionStatus;
