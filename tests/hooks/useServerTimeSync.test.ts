import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useServerTimeSync } from '@/hooks/useServerTimeSync';
import { getServerTime } from '@/lib/server-time';
import { Timestamp } from 'firebase/firestore';

// Mock the module explicitly
vi.mock('@/lib/server-time', () => ({
  getServerTime: vi.fn(),
}));

describe('useServerTimeSync', () => {

  beforeEach(() => {
    // Default mock implementation
    (getServerTime as Mock).mockResolvedValue(new Date('2024-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useServerTimeSync('session-1', new Date()));
    expect(result.current.liveOffset).toBe(0);
    expect(result.current.isSynced).toBe(false);
  });

  it('syncs and calculates offset correctly', async () => {
    // Mock server time to be 100 seconds after start time
    const startTime = new Date('2024-01-01T10:00:00Z');
    const serverTime = new Date('2024-01-01T10:01:40Z'); // 100s difference
    
    (getServerTime as Mock).mockResolvedValue(serverTime);

    const { result } = renderHook(() => useServerTimeSync('session-1', startTime));

    await waitFor(() => {
      expect(result.current.isSynced).toBe(true);
    });

    expect(result.current.liveOffset).toBe(100);
  });

  it('handles scheduledStart as Timestamp', async () => {
    const startTimeDate = new Date('2024-01-01T10:00:00Z');
    const startTime = Timestamp.fromDate(startTimeDate);
    const serverTime = new Date('2024-01-01T10:00:30Z'); // 30s difference

    (getServerTime as Mock).mockResolvedValue(serverTime);

    const { result } = renderHook(() => useServerTimeSync('session-1', startTime));

    await waitFor(() => {
      expect(result.current.isSynced).toBe(true);
    });

    expect(result.current.liveOffset).toBe(30);
  });

  it('never returns negative offset', async () => {
    // Server time is BEFORE start time
    const startTime = new Date('2024-01-01T10:00:00Z');
    const serverTime = new Date('2024-01-01T09:59:00Z'); // 1 min before

    (getServerTime as Mock).mockResolvedValue(serverTime);

    const { result } = renderHook(() => useServerTimeSync('session-1', startTime));

    await waitFor(() => {
      expect(result.current.isSynced).toBe(true);
    });

    expect(result.current.liveOffset).toBe(0);
  });
});
