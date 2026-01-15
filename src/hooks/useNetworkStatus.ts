import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createElement } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connected', {
        icon: createElement(Wifi, { className: "h-4 w-4 text-green-500" }),
        duration: 2000,
        id: 'connection-status'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. Working offline...', {
        icon: createElement(WifiOff, { className: "h-4 w-4 text-red-500" }),
        duration: Infinity,
        id: 'connection-status'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
