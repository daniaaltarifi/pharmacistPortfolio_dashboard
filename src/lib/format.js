const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' })

// "2026-09-18" -> "Sep 18, 2026". DATEONLY values are read as UTC so they never shift a day.
export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value)
  return Number.isNaN(date.getTime()) ? value : dateFmt.format(date)
}

// "2h", "Yesterday", "Oct 13" for message timestamps.
export function formatAgo(value) {
  const date = new Date(value)
  const minutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  if (hours < 48) return 'Yesterday'
  return shortFmt.format(date)
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

// Site paths like "/images/..." live on the portfolio, not the dashboard.
export const SITE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5173').replace(/\/$/, '')

export function imageSrc(url) {
  if (!url) return ''
  return url.startsWith('/') ? `${SITE_URL}${url}` : url
}
