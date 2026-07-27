import { describe, expect, it } from 'vitest'
import { formatRelativeDate } from '@/lib/dates'

const NOW = new Date(2026, 6, 27) // 27 July 2026

describe('formatRelativeDate', () => {
  it('handles today and days', () => {
    expect(formatRelativeDate('2026-07-27', NOW)).toBe('today')
    expect(formatRelativeDate('2026-07-26', NOW)).toBe('1 day ago')
    expect(formatRelativeDate('2026-07-23', NOW)).toBe('4 days ago')
  })

  it('switches to weeks from 7 to 34 days', () => {
    expect(formatRelativeDate('2026-07-20', NOW)).toBe('1 week ago')
    expect(formatRelativeDate('2026-06-29', NOW)).toBe('4 weeks ago')
  })

  it('uses the absolute date beyond 4 weeks', () => {
    expect(formatRelativeDate('2026-06-22', NOW)).toBe('22 June')
  })

  it('appends the year when not current', () => {
    expect(formatRelativeDate('2025-06-24', NOW)).toBe('24 June 2025')
  })
})
