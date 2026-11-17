const MILLISECONDS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60

const HOURS_PER_DAY = 24
const DAYS_PER_WEEK = 7

export function formatDateAgo(timestamp: number, now: number): string {
  const minutes = Math.floor((now - timestamp) / MILLISECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const days = Math.floor(hours / HOURS_PER_DAY)
  if (minutes < 1) return 'just now'
  if (hours < 1) return `${minutes} min ago`
  if (days < 1) return `${hours} hr ago`
  if (days === 1) return 'Yesterday'
  if (days < DAYS_PER_WEEK) return `${days} days ago`

  const date = new Date(timestamp)
  const isThisYear = date.getFullYear() === new Date(now).getFullYear()
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' })
  })
}

export function formatTimeAgo(timestamp: number, now: number): string {
  const minutes = Math.floor((now - timestamp) / MILLISECONDS_PER_MINUTE)
  if (minutes < 1) return 'just now'
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min ago`
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
