import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  // We use a separate state for "reconnecting" visual if needed, 
  // but for now user asked for:
  // - Green dot: Connected
  // - Red dot: Disconnected
  // - Animated pulse when reconnecting (which is usually the transition or a specific state).
  // browser 'online' event fires when connected. 'offline' when disconnected.
  // We can simulate "reconnecting" by showing a pulse immediately after offline -> online transition 
  // or just pulsing the red dot when offline?
  // Let's interpret "Animated pulse when reconnecting" as "When we are offline, we are trying to reconnect" 
  // OR "When we just came back online". 
  // A common pattern is: Red = Offline. Text says "Reconnecting...".
  // Let's make the red dot pulse when offline to show activity/attention.
  
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      toast.success('Connected', {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        duration: 2000,
      });
    };

    const handleOffline = () => {
      setIsConnected(false);
      toast.error('Connection lost. Reconnecting...', {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        duration: Infinity, // Keep until reconnected
        id: 'offline-toast', // ID to dismiss programmatically if needed
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dismiss offline toast when back online
  useEffect(() => {
    if (isConnected) {
      toast.dismiss('offline-toast');
    }
  }, [isConnected]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-sm text-xs font-medium">
      <div className="relative flex h-2.5 w-2.5">
        {isConnected ? (
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
        isConnected ? "text-muted-foreground" : "text-red-500"
      )}>
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </span>
    </div>
  );
};

export default ConnectionStatus;
