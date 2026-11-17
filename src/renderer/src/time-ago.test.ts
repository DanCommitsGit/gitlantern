import { describe, expect, it } from 'vitest'
import { formatDateAgo } from './time-ago'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const NOW = new Date(2026, 10, 16, 12).getTime()

describe('formatDateAgo', () => {
  it.each([
    [30_000, 'just now'],
    [12 * MINUTE, '12 min ago'],
    [3 * HOUR, '3 hr ago'],
    [30 * HOUR, 'Yesterday'],
    [3 * DAY, '3 days ago']
  ])('describes %i milliseconds ago as %s', (age, expected) => {
    expect(formatDateAgo(NOW - age, NOW)).toBe(expected)
  })

  it('gives the date after a week, with the year only for another year', () => {
    expect(formatDateAgo(new Date(2026, 9, 24).getTime(), NOW)).not.toContain('2026')
    expect(formatDateAgo(new Date(2025, 9, 24).getTime(), NOW)).toContain('2025')
  })
})
