import { describe, it, expect } from 'vitest';
import { formatRelativeTime, formatDuration, formatTimestamp } from '@/lib/format-time';
import { Timestamp } from 'firebase/firestore';

describe('formatRelativeTime', () => {
  it('returns empty string for null/undefined', () => {
    // @ts-ignore
    expect(formatRelativeTime(null)).toBe('');
    // @ts-ignore
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('formats "now" correctly', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('now');
  });

  it('formats minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
    expect(formatRelativeTime(date)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(formatRelativeTime(date)).toBe('2h ago');
  });

  it('formats days ago', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    expect(formatRelativeTime(date)).toBe('3d ago');
  });

  it('handles Firebase Timestamp', () => {
    const date = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
    const timestamp = Timestamp.fromDate(date);
    expect(formatRelativeTime(timestamp)).toBe('10m ago');
  });

  it('handles timestamp number', () => {
    const date = Date.now() - 10 * 1000; // 10 seconds ago
    expect(formatRelativeTime(date)).toBe('now');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3665)).toBe('1h 1m 5s');
  });

  it('returns 0s for 0 or negative', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(-10)).toBe('0s');
  });
});

describe('formatTimestamp', () => {
  it('formats date correctly', () => {
    // Fixed date: Jan 15 2024, 14:30:00
    const date = new Date('2024-01-15T14:30:00');
    // Output depends on local time of the test runner, but roughly:
    // "Jan 15, 2:30 PM"
    expect(formatTimestamp(date)).toMatch(/Jan 15, \d{1,2}:\d{2} [AP]M/);
  });
});
