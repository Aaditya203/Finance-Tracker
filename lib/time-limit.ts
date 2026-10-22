export const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours in milliseconds

/**
 * Checks whether a record was created within the last 2 days (48 hours).
 */
export function isWithinTwoDays(createdAt: Date | string | null | undefined): boolean {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;
  return Date.now() - createdTime <= TWO_DAYS_MS;
}

/**
 * Returns a human-readable remaining time string before the 2-day edit/delete window expires.
 */
export function getTimeRemainingText(createdAt: Date | string | null | undefined): string {
  if (!createdAt) return "Window expired";
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return "Window expired";
  const diffMs = TWO_DAYS_MS - (Date.now() - createdTime);
  if (diffMs <= 0) return "Window expired (more than 2 days ago)";
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
