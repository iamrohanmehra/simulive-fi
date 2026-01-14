import { Badge } from '@/components/ui/badge';
import { Clock, Radio, CheckCircle } from 'lucide-react';

interface SessionStatusBadgeProps {
  status: 'scheduled' | 'live' | 'ended';
  className?: string; // Allow additional styling wrapper if needed
}

export default function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  if (status === 'live') {
    return (
      <Badge variant="destructive" className={`animate-pulse gap-1 ${className}`}>
        <Radio className="h-3 w-3" />
        LIVE
      </Badge>
    );
  }

  if (status === 'scheduled') {
    return (
      <Badge variant="outline" className={`text-blue-500 border-blue-500/30 gap-1 ${className}`}>
        <Clock className="h-3 w-3" />
        Scheduled
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`gap-1 ${className}`}>
      <CheckCircle className="h-3 w-3" />
      Ended
    </Badge>
  );
}
