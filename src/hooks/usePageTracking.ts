import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startTrace, endTrace } from '@/lib/performance';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Create a custom trace for route changes if needed. 
    // Firebase Perf auto-traces page loads but not always SPA route changes as 'screen_view' in same granularity.
    // We can just log a trace for the duration of being on a page? No, that's session duration.
    // We can log "route_change" metric or trace execution of route transition?
    // Let's just trace "route_change_to_${path}"? No, too many traces.
    // A simple "route_transition" trace that ends immediately isn't useful.
    // However, logging a trace that starts on mount and ends on unmount = time spent on page?
    // No, standard is to trace 'screen_view' via Analytics, not Performance.
    // Performance monitors "duration of operations". 
    // Is there an operation? "page_load"?
    // Let's trace "page_view" duration?
    
    // The requirement says: "Track route changes" and "Record page load times".
    // "page load times" for SPA is tricky. 
    // Let's trace "route_mount" to measure component mount time? React Profiler does that.
    
    // Simplest useful metric: Record that a route change happened.
    // But Trace must have duration.
    // Let's start a trace 'page_view_duration' and stop it on unmount or change.
    
    const t = startTrace(`view_${location.pathname}`);
    
    return () => {
      endTrace(t);
    };
  }, [location.pathname]);
};
