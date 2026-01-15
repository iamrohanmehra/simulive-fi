import { format, formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * Returns a relative time string (e.g., "2m ago", "5h ago", "3d ago").
 */
export function formatRelativeTime(date: Date | Timestamp | number): string {
  const d = normalizeDate(date);
  if (!d) return '';
  // date-fns formatDistanceToNow gives "about 5 hours", "less than a minute"
  // We can use a custom logic or just shorten the date-fns output if strictly needed,
  // or use formatDistanceToNowStrict.
  // The user requested: "2m ago", "5h ago", "3d ago".
  // date-fns doesn't standardly output exactly that short format without locale customization or string manipulation.
  // I will implement a wrapper to match the requested format as closely as possible or use strict mode and replace.
  
  const distance = formatDistanceToNow(d, { addSuffix: true });
  
  // Simple abbreviations
  let formatted = distance
    .replace('about ', '')
    .replace('less than a minute', 'now')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' seconds', 's')
    .replace(' second', 's');
    
    if (formatted.startsWith('now')) {
        return 'now';
    }

    return formatted;
}

/**
 * Returns a formatted duration string (e.g., "12m 34s", "1h 23m 45s").
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Always show seconds if hours is 0, or if specific precision needed. 
  // User example: "12m 34s", "1h 23m 45s".
  // So yes, seconds are included.
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Returns a formatted timestamp string (e.g., "Jan 15, 2:30 PM").
 */
export function formatTimestamp(date: Date | Timestamp | number): string {
  const d = normalizeDate(date);
  if (!d) return '';
  return format(d, 'MMM d, p');
}

/**
 * Helper to normalize Date | Timestamp | number to Date
 */
function normalizeDate(date: Date | Timestamp | number): Date | null {
  if (!date) return null;
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === 'number') return new Date(date);
  return date;
}
