import { describe, it, expect } from 'vitest';
import { generateColorFromName } from '@/lib/username-colors';

describe('generateColorFromName', () => {
  it('returns a string starting with text-', () => {
    const color = generateColorFromName('Alice');
    expect(color).toMatch(/^text-[a-z]+-400$/);
  });

  it('returns consistent color for same name', () => {
    const color1 = generateColorFromName('Bob');
    const color2 = generateColorFromName('Bob');
    expect(color1).toBe(color2);
  });

  it('returns different colors for different names (likely)', () => {
    generateColorFromName('Alice');
    // Using a name that we know hashes differently or just checking not all are same
    const colors = new Set();
    ['Alice', 'Bob', 'Charlie', 'David', 'Eve'].forEach(name => {
      colors.add(generateColorFromName(name));
    });
    expect(colors.size).toBeGreaterThan(1);
  });

  it('handles empty name', () => {
    const color = generateColorFromName('');
    expect(color).toBeDefined();
    expect(color).toMatch(/^text-[a-z]+-400$/);
  });
});
