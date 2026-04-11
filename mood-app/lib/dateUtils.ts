export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function todayString(): string {
  return toDateString(new Date())
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isToday(dateString: string): boolean {
  return dateString === todayString()
}

export function isFuture(dateString: string): boolean {
  return dateString > todayString()
}

export function addDays(dateString: string, days: number): string {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
