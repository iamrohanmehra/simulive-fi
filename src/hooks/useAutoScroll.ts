import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * FIXED #1: Extracted shared auto-scroll hook from ChatSidebar and AdminChatFeed
 * 
 * Provides auto-scroll functionality for chat-like components with:
 * - Bottom ref for scroll target
 * - Smart scroll behavior (smooth when at bottom, auto on initial load)
 * - Scroll position tracking to detect if user scrolled up
 */
export function useAutoScroll<T>(
  items: T[],
  loading: boolean
) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Smooth scroll when new items arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items, isAtBottom]);

  // Initial scroll (auto, not smooth) when loading completes
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading]);

  // Handle scroll events to track if user is at bottom
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const distanceFromBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
    setIsAtBottom(distanceFromBottom < 50);
  }, []);

  // Force scroll to bottom (e.g., after sending a message)
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setIsAtBottom(true);
  }, []);

  return {
    bottomRef,
    isAtBottom,
    setIsAtBottom,
    handleScroll,
    scrollToBottom,
  };
}

export default useAutoScroll;
