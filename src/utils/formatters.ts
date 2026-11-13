/**
 * Format numbers into ordinal strings:
 * 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th", 21 -> "21st", etc.
 */
export function formatOrdinal(n: number): string {
  const abs = Math.abs(Math.round(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${abs}th`;
  }
  switch (abs % 10) {
    case 1:
      return `${abs}st`;
    case 2:
      return `${abs}nd`;
    case 3:
      return `${abs}rd`;
    default:
      return `${abs}th`;
  }
}

/**
 * Cleanly format an array of week numbers (e.g., [1, 3] -> "1st & 3rd Weeks", [4, 5] -> "4th & 5th Weeks")
 */
export function formatApplicableWeeks(weeks: number[]): string {
  if (!weeks || weeks.length === 0) return 'No Weeks';
  const sorted = [...weeks].sort((a, b) => a - b);
  if (sorted.length === 5 && [1, 2, 3, 4, 5].every((w) => sorted.includes(w))) {
    return 'Every Week';
  }
  if (sorted.length === 1) {
    return `${formatOrdinal(sorted[0])} Week only`;
  }
  const ordinals = sorted.map(formatOrdinal);
  if (ordinals.length === 2) {
    return `${ordinals[0]} & ${ordinals[1]} Weeks`;
  }
  const last = ordinals.pop();
  return `${ordinals.join(', ')} & ${last} Weeks`;
}

/**
 * Handle proper English singular vs plural nouns.
 * Example: pluralize(1, "class") -> "1 class"
 * Example: pluralize(2, "class", "classes") -> "2 classes"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural || `${singular}s`;
  return `${count} ${word}`;
}

/**
 * Pluralize noun without including the count number.
 * Example: nounOnly(1, "class") -> "class"
 * Example: nounOnly(2, "class", "classes") -> "classes"
 */
export function nounOnly(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/**
 * Validate that a time string is in valid 24h format "HH:mm" (00:00 to 23:59)
 */
export function isValid24hTime(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr.trim());
}

/**
 * Convert time string "HH:mm" to total minutes from midnight for comparisons
 */
export function timeToMinutes(timeStr: string): number {
  if (!isValid24hTime(timeStr)) return 0;
  const [h, m] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
}
