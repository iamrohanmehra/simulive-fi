/**
 * Utility to generate consistent colors from usernames using a hash function.
 * Maps names to a palette of 12 Tailwind colors.
 */

const COLORS = [
  'text-blue-400',
  'text-green-400',
  'text-purple-400',
  'text-pink-400',
  'text-yellow-400',
  'text-red-400',
  'text-indigo-400',
  'text-teal-400',
  'text-orange-400',
  'text-cyan-400',
  'text-violet-400',
  'text-lime-400',
];

/**
 * Generates a consistent color class from a given name.
 * 
 * @param name - The name to generate a color for.
 * @returns A Tailwind CSS class string for text color.
 */
export function generateColorFromName(name: string): string {
  if (!name) return COLORS[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}
