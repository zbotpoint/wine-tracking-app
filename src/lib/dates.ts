// "1 day ago" … "4 weeks ago", then "24 June" (with the year when not the
// current year). Dates are YYYY-MM-DD, interpreted in local time.
export function formatRelativeDate(isoDate: string, now: Date = new Date()): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - date.getTime()) / 86_400_000)

  if (days === 0) return 'today'
  if (days >= 1 && days < 7) return days === 1 ? '1 day ago' : `${days} days ago`
  if (days >= 7 && days < 35) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  }

  const absolute = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  return date.getFullYear() === now.getFullYear()
    ? absolute
    : `${absolute} ${date.getFullYear()}`
}
