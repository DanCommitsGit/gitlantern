const MILLISECONDS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60

export function formatTimeAgo(timestamp: number, now: number): string {
  const minutes = Math.floor((now - timestamp) / MILLISECONDS_PER_MINUTE)
  if (minutes < 1) return 'just now'
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min ago`
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
