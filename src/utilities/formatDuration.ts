/**
 * Format a duration in seconds to a human-readable string
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 2m 45s", "5m 10s", "43s")
 */
export function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return '—'
  
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  
  return parts.join(' ')
}
